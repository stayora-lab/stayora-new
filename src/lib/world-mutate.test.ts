import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  acceptRequest,
  createEmptyWorld,
  createRequest,
  DomainError,
  type World,
} from "./domain/engine.ts";
import type { Actor } from "./domain/types.ts";
import { overlappingActive } from "./domain/availability.ts";
import { mutateWorld } from "./world-mutate.ts";
import { applyWorldAction } from "./world-actions.ts";

const HOST: Actor = { persona: "HOST" };
const NOW = "2026-09-22T03:00:00.000Z";
const HOST_ROLE = { persona: "HOST" as const, hostId: "host-oceanami" };

function assertNoOverlap(world: World) {
  const pairs = overlappingActive(world);
  assert.equal(pairs.length, 0, pairs.map(([a, b]) => `${a.id}/${b.id}`).join("; "));
}

function memoryIo(initial: World) {
  let world = initial;
  let version = 1;
  return {
    get world() {
      return world;
    },
    get version() {
      return version;
    },
    io: {
      load: async () => ({ world: structuredClone(world), version }),
      save: async (next: World, expected: number) => {
        if (expected !== version) return false;
        world = next;
        version += 1;
        return true;
      },
    },
  };
}

describe("shared world optimistic concurrency", () => {
  it("two concurrent acceptRequest calls on overlapping requests → exactly one ACTIVE hold, the other CONFLICTED", async () => {
    let world = createEmptyWorld(NOW);
    const first = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: { persona: "GUEST" },
    });
    const second = createRequest(first.world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: { persona: "GUEST" },
    });
    const store = memoryIo(second.world);

    const snapA = await store.io.load();
    const snapB = await store.io.load();
    assert.equal(snapA.version, snapB.version);

    const appliedA = acceptRequest(snapA.world, { requestId: first.request.id, actor: HOST });
    assert.equal(await store.io.save(appliedA.world, snapA.version), true);

    let loadCount = 0;
    const result = await mutateWorld(
      {
        load: async () => {
          loadCount += 1;
          if (loadCount === 1) return snapB;
          return store.io.load();
        },
        save: store.io.save,
      },
      (current) =>
        applyWorldAction(current, { type: "ACCEPT_REQUEST", requestId: second.request.id }, HOST_ROLE),
    );

    const holds = result.world.commitments.filter(
      (item) => item.kind === "HOLD" && item.status === "ACTIVE",
    );
    assert.equal(holds.length, 1);
    assert.equal(holds[0]?.requestId, first.request.id);
    assert.equal(result.world.requests.find((item) => item.id === first.request.id)?.status, "ACCEPTED");
    assert.equal(
      result.world.requests.find((item) => item.id === second.request.id)?.status,
      "CONFLICTED",
    );
    assert.equal(store.version, 3);
    assertNoOverlap(result.world);
  });

  it("two failed writes return CONCURRENT_CHANGE", async () => {
    const store = memoryIo(createEmptyWorld(NOW));
    await assert.rejects(
      () =>
        mutateWorld(
          {
            load: async () => ({ world: store.world, version: 0 }),
            save: async () => false,
          },
          (world) => ({ world }),
        ),
      (error: unknown) =>
        error instanceof DomainError &&
        error.code === "CONCURRENT_CHANGE" &&
        error.message === "Có người vừa thay đổi — thử lại",
    );
  });
});

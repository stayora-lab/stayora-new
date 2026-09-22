import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEmptyWorld, DomainError } from "./domain/engine.ts";
import { applyWorldAction } from "./world-actions.ts";
import { authorizeRole, isAdminConfigured } from "./authorize.ts";
import { assertPilotSeed, DESTINATION_NAME, PILOT_SEED, type PilotSeed } from "./pilot-data.ts";
import { visibleGuestName } from "./privacy.ts";

const NOW = "2026-09-22T03:00:00.000Z";
const SECRET = "test-admin-secret";

function withAdminKey<T>(key: string | undefined, fn: () => T): T {
  const prev = process.env.ADMIN_KEY;
  if (key === undefined) delete process.env.ADMIN_KEY;
  else process.env.ADMIN_KEY = key;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.ADMIN_KEY;
    else process.env.ADMIN_KEY = prev;
  }
}

function cloneSeed(): PilotSeed {
  return structuredClone(PILOT_SEED);
}

describe("admin key", () => {
  it("wrong key → GUEST, RESET is refused FORBIDDEN", () => {
    withAdminKey(SECRET, () => {
      const role = authorizeRole("admin", "wrong-key");
      assert.equal(role.persona, "GUEST");
      assert.throws(
        () => applyWorldAction(createEmptyWorld(NOW), { type: "RESET" }, role),
        (error: unknown) =>
          error instanceof DomainError && error.code === "FORBIDDEN",
      );
    });
  });

  it("an action with role ADMIN and a wrong key is refused FORBIDDEN", () => {
    withAdminKey(SECRET, () => {
      const role = authorizeRole("admin", "not-the-key");
      assert.equal(role.persona, "GUEST");
      assert.throws(
        () =>
          applyWorldAction(
            createEmptyWorld(NOW),
            { type: "RECORD_PAYMENT", obligationId: "ob_x", outcome: "SUCCEEDED" },
            role,
          ),
        (error: unknown) =>
          error instanceof DomainError && error.code === "FORBIDDEN",
      );
    });
  });

  it("missing key → GUEST", () => {
    withAdminKey(SECRET, () => {
      assert.equal(authorizeRole("admin").persona, "GUEST");
      assert.equal(authorizeRole("admin", "").persona, "GUEST");
    });
  });

  it("correct key → ADMIN", () => {
    withAdminKey(SECRET, () => {
      assert.equal(authorizeRole("admin", SECRET).persona, "ADMIN");
    });
  });

  it("non-admin vai does not need a key", () => {
    withAdminKey(SECRET, () => {
      assert.deepEqual(authorizeRole("host-a"), { persona: "HOST", hostId: "host-a" });
      assert.deepEqual(authorizeRole("sale-b"), { persona: "SALE", saleId: "sale-b" });
    });
  });

  it("with ADMIN_KEY unset, role admin with any key → FORBIDDEN", () => {
    withAdminKey(undefined, () => {
      assert.equal(isAdminConfigured(), false);
      for (const key of ["any-key", "wrong", "x"]) {
        const role = authorizeRole("admin", key);
        assert.equal(role.persona, "GUEST");
        assert.throws(
          () => applyWorldAction(createEmptyWorld(NOW), { type: "RESET" }, role),
          (error: unknown) =>
            error instanceof DomainError && error.code === "FORBIDDEN",
        );
      }
    });
  });
});

describe("pilot seed hygiene", () => {
  it("current seed is valid and has no person named Oceanami", () => {
    assert.doesNotThrow(() => assertPilotSeed(PILOT_SEED));
    const people = [
      ...PILOT_SEED.hosts,
      ...PILOT_SEED.sales,
      ...PILOT_SEED.butlers,
    ];
    for (const person of people) {
      assert.notEqual(person.name.trim().toLowerCase(), DESTINATION_NAME.toLowerCase());
    }
    for (const stay of PILOT_SEED.existingStays) {
      assert.notEqual(stay.source.trim().toLowerCase(), DESTINATION_NAME.toLowerCase());
    }
    assert.ok(PILOT_SEED.hosts.some((person) => person.id === "host-a"));
    assert.ok(PILOT_SEED.hosts.some((person) => person.id === "host-b"));
    assert.ok(PILOT_SEED.sales.some((person) => person.id === "sale-b"));
    assert.ok(PILOT_SEED.sales.some((person) => person.id === "sale-c"));
    const a = PILOT_SEED.villas.filter((villa) => villa.hostId === "host-a");
    const b = PILOT_SEED.villas.filter((villa) => villa.hostId === "host-b");
    assert.equal(a.length, 3);
    assert.equal(b.length, 3);
  });

  it("throws if a host is named Oceanami", () => {
    const seed = cloneSeed();
    seed.hosts[0] = { id: "host-a", name: "Oceanami" };
    assert.throws(
      () => assertPilotSeed(seed),
      /must not equal destination/,
    );
  });

  it("throws if a source is named Oceanami", () => {
    const seed = cloneSeed();
    seed.existingStays[0] = {
      ...seed.existingStays[0]!,
      source: "Oceanami" as PilotSeed["existingStays"][number]["source"],
    };
    assert.throws(() => assertPilotSeed(seed), /must not equal destination/);
  });

  it("throws if seed contains a phone number", () => {
    const seed = cloneSeed();
    seed.existingStays[0] = { ...seed.existingStays[0]!, guestName: "0901234567" };
    assert.throws(() => assertPilotSeed(seed), /phone/);
  });

  it("throws if seed contains an ID number", () => {
    const seed = cloneSeed();
    seed.existingStays[0] = { ...seed.existingStays[0]!, guestName: "079123456789" };
    assert.throws(() => assertPilotSeed(seed), /ID numbers/);
  });
});

describe("guest name privacy", () => {
  const stay = {
    guestName: "Gia đình Trần",
    villaId: "huong-tram",
    origin: "EXTERNAL" as const,
  };

  it("Host of that villa and Butler see the name; BQL and Sale see Khách", () => {
    assert.equal(visibleGuestName(stay, { persona: "HOST", hostId: "host-a" }), "Gia đình Trần");
    assert.equal(visibleGuestName(stay, { persona: "HOST", hostId: "host-b" }), "Khách");
    assert.equal(
      visibleGuestName(stay, { persona: "BUTLER", butlerId: "butler-linh" }),
      "Gia đình Trần",
    );
    assert.equal(visibleGuestName(stay, { persona: "BQL" }), "Khách");
    assert.equal(visibleGuestName(stay, { persona: "SALE", saleId: "sale-mai" }), "Khách");
    assert.equal(visibleGuestName(stay, { persona: "ADMIN" }), "Gia đình Trần");
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEmptyWorld, createRequest, DomainError } from "./domain/engine.ts";
import { applyWorldAction } from "./world-actions.ts";
import { resolveWorkingRole, type AccessGrant } from "./access.ts";
import { projectWorldForCaller } from "./guest-access.ts";

const NOW = "2026-09-24T01:00:00.000Z";
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

const hostGrant: AccessGrant = {
  id: "g-host",
  role: "HOST",
  scopeRef: "host-an",
  status: "active",
};
const saleGrant: AccessGrant = {
  id: "g-sale",
  role: "SALE",
  scopeRef: "sale-an",
  status: "active",
};

describe("dev access", () => {
  it("sign-up with no grants is a guest, even if the client sends admin", () => {
    const role = resolveWorkingRole({
      signedIn: true,
      grants: [],
      vai: "admin",
      key: "anything",
    });
    assert.deepEqual(role, { persona: "GUEST" });
  });

  it("an active grant is the role; a client-sent role is ignored", () => {
    const role = resolveWorkingRole({
      signedIn: true,
      grants: [hostGrant, saleGrant],
      grantId: "g-sale",
      vai: "admin",
      key: "stayora-thu",
    });
    assert.deepEqual(role, { persona: "SALE", saleId: "sale-an" });
  });

  it("host and butler villa grants authorize every selected villa", () => {
    const host = resolveWorkingRole({
      signedIn: true,
      grants: [
        { id: "h1", role: "HOST", scopeRef: "t01", status: "active" },
        { id: "h2", role: "HOST", scopeRef: "t06", status: "active" },
        { id: "bad", role: "HOST", scopeRef: "T01-T06", status: "active" },
      ],
      grantId: "h1",
    });
    assert.deepEqual(host.villaIds, ["t01", "t06"]);
    assert.equal(host.hostId, "T01-T06");
    const world = createEmptyWorld(NOW);
    const block = {
      type: "CREATE_BLOCK" as const,
      start: "2026-12-01",
      end: "2026-12-03",
      blockKind: "OWNER" as const,
    };
    assert.equal(
      applyWorldAction(world, { ...block, villaId: "t01" }, host).world.commitments.some(
        (item) => item.villaId === "t01",
      ),
      true,
    );
    assert.equal(
      applyWorldAction(world, { ...block, villaId: "t06" }, host).world.commitments.some(
        (item) => item.villaId === "t06",
      ),
      true,
    );
    assert.throws(
      () => applyWorldAction(world, { ...block, villaId: "t12" }, host),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
  });

  it("a revoke takes effect on the next resolution", () => {
    const revoked: AccessGrant = { ...hostGrant, status: "revoked" };
    const before = resolveWorkingRole({
      signedIn: true,
      grants: [hostGrant],
      grantId: "g-host",
    });
    const after = resolveWorkingRole({
      signedIn: true,
      grants: [revoked],
      grantId: "g-host",
    });
    assert.equal(before.persona, "HOST");
    assert.equal(after.persona, "GUEST");
    assert.throws(
      () => applyWorldAction(createEmptyWorld(NOW), { type: "RESET" }, after),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
  });

  it("unsigned callers stay guests unless demo mode presents the admin key", () => {
    withAdminKey(SECRET, () => {
      assert.deepEqual(
        resolveWorkingRole({ signedIn: false, grants: [], vai: "host-an" }),
        { persona: "GUEST" },
      );
      assert.deepEqual(
        resolveWorkingRole({ signedIn: false, grants: [], vai: "host-an", key: SECRET }),
        { persona: "GUEST" },
      );
      for (const vai of ["host-an", "sale-binh", "butler-chi", "bql", "admin"]) {
        assert.equal(
          resolveWorkingRole({ signedIn: false, grants: [], demo: true, vai }).persona,
          "GUEST",
        );
        assert.equal(
          resolveWorkingRole({ signedIn: false, grants: [], demo: true, vai, key: "wrong" }).persona,
          "GUEST",
        );
      }
      assert.deepEqual(
        resolveWorkingRole({
          signedIn: false,
          grants: [],
          demo: true,
          vai: "host-an",
          key: SECRET,
        }),
        { persona: "HOST", hostId: "host-an" },
      );
      assert.deepEqual(
        resolveWorkingRole({
          signedIn: false,
          grants: [],
          demo: true,
          vai: "sale-binh",
          key: SECRET,
        }),
        { persona: "SALE", saleId: "sale-binh" },
      );
      assert.deepEqual(
        resolveWorkingRole({
          signedIn: false,
          grants: [],
          demo: true,
          vai: "butler-chi",
          key: SECRET,
        }),
        { persona: "BUTLER", butlerId: "butler-chi" },
      );
      assert.deepEqual(
        resolveWorkingRole({ signedIn: false, grants: [], demo: true, vai: "bql", key: SECRET }),
        { persona: "BQL" },
      );
      assert.equal(
        resolveWorkingRole({ signedIn: false, grants: [], demo: true, vai: "admin", key: SECRET })
          .persona,
        "ADMIN",
      );
      const world = createRequest(createEmptyWorld(NOW), {
        villaId: "t01",
        checkIn: "2026-10-01",
        checkOut: "2026-10-04",
        guests: 2,
        guestName: "An",
        guestPhone: "0901000001",
        actor: { persona: "GUEST" },
      }).world;
      const denied = resolveWorkingRole({
        signedIn: false,
        grants: [],
        demo: true,
        vai: "host-an",
      });
      const allowed = resolveWorkingRole({
        signedIn: false,
        grants: [],
        demo: true,
        vai: "host-an",
        key: SECRET,
      });
      assert.equal(projectWorldForCaller(world, denied).requests.length, 0);
      assert.equal(projectWorldForCaller(world, allowed).requests.length, 1);
    });
  });

  it("a guest can still create a request while signed out", () => {
    const role = resolveWorkingRole({ signedIn: false, grants: [] });
    const result = applyWorldAction(
      createEmptyWorld(NOW),
      {
        type: "CREATE_REQUEST",
        villaId: "t01",
        checkIn: "2026-10-01",
        checkOut: "2026-10-04",
        guests: 2,
        guestName: "An",
        guestPhone: "0901000001",
      },
      role,
    );
    assert.equal(result.world.requests.length, 1);
    assert.equal(result.world.requests[0]?.source, "GUEST");
  });
});

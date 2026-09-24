import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createEmptyWorld, DomainError } from "./domain/engine.ts";
import { applyWorldAction } from "./world-actions.ts";
import { resolveWorkingRole, type AccessGrant } from "./access.ts";

const NOW = "2026-09-24T01:00:00.000Z";

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

  it("unsigned callers stay guests unless demo mode is on", () => {
    assert.deepEqual(
      resolveWorkingRole({ signedIn: false, grants: [], vai: "host-an" }),
      { persona: "GUEST" },
    );
    assert.deepEqual(
      resolveWorkingRole({ signedIn: false, grants: [], demo: true, vai: "host-an" }),
      { persona: "HOST", hostId: "host-an" },
    );
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
      },
      role,
    );
    assert.equal(result.world.requests.length, 1);
    assert.equal(result.world.requests[0]?.source, "GUEST");
  });
});

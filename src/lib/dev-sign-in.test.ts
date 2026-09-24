import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { DomainError, createEmptyWorld } from "./domain/engine.ts";
import { PILOT_SEED } from "./pilot-data.ts";
import { resolveWorkingRole, type AccessGrant } from "./access.ts";
import { applyWorldAction, type WorldAction } from "./world-actions.ts";
import { assertDevSignInEnabled, devSignInEnabled } from "./dev-sign-in.ts";

const NOW = "2026-09-24T02:00:00.000Z";
const SHARED_PASSWORD = "Stayora-thu-1";

const ADMIN_ACTIONS: WorldAction[] = [
  { type: "RESET" },
  { type: "RECORD_PAYMENT", obligationId: "none", outcome: "SUCCEEDED" },
  { type: "RESOLVE_UNKNOWN", attemptId: "none", outcome: "FAILED" },
  { type: "MARK_REFUND", refundId: "none", note: "no" },
  {
    type: "RESOLVE_CONFLICT",
    conflictId: "none",
    keepCommitmentId: "a",
    endCommitmentId: "b",
    reason: "no",
  },
];

function grantsFor(personId: string): AccessGrant[] {
  return (PILOT_SEED.grants ?? [])
    .filter((grant) => grant.personId === personId)
    .map((grant) => ({
      id: `grant_${personId}_${grant.role}`,
      role: grant.role,
      scopeRef: grant.scopeRef,
      status: "active" as const,
    }));
}

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("DEV_SIGN_IN", () => {
  const previous = process.env.DEV_SIGN_IN;

  afterEach(() => {
    if (previous === undefined) delete process.env.DEV_SIGN_IN;
    else process.env.DEV_SIGN_IN = previous;
  });

  it("is off when unset, empty, or any value other than 1 or true", () => {
    delete process.env.DEV_SIGN_IN;
    assert.equal(devSignInEnabled(), false);
    for (const value of ["", "0", "false", "off", "yes", "on"]) {
      assert.equal(devSignInEnabled(value), false, value);
    }
  });

  it("is on only for 1 or true", () => {
    assert.equal(devSignInEnabled("1"), true);
    assert.equal(devSignInEnabled("true"), true);
    assert.equal(devSignInEnabled("TRUE"), true);
    process.env.DEV_SIGN_IN = "1";
    assert.equal(devSignInEnabled(), true);
  });

  it("refuses sign-in before any account lookup when the flag is unset", () => {
    delete process.env.DEV_SIGN_IN;
    assert.throws(
      () => assertDevSignInEnabled(),
      (error: unknown) =>
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "DEV_SIGN_IN_OFF",
    );
    const server = source("./dev-identity.server.ts");
    const signIn = server.slice(server.indexOf("export async function signInDev"));
    assert.match(signIn.slice(0, signIn.indexOf("ensureDevAccounts")), /assertDevSignInEnabled\(\)/);
    const accounts = source("../routes/dev.accounts.tsx");
    assert.match(accounts, /if \(!gate\.enabled\) throw notFound\(\)/);
  });

  it("does not put the shared password in client modules", () => {
    for (const path of ["./pilot-data.ts", "../routes/login.tsx", "../routes/dev.accounts.tsx"]) {
      assert.equal(source(path).includes(SHARED_PASSWORD), false, path);
    }
    const server = source("./dev-identity.server.ts");
    assert.match(server, /if \(!devSignInEnabled\(\)\) return \{ enabled: false \}/);
    assert.match(server, /password: DEV_PASSWORD/);
  });
});

describe("dev accounts cannot run Stayora vận hành", () => {
  it("the seed grants no ADMIN role", () => {
    assert.equal(
      (PILOT_SEED.grants ?? []).some((grant) => grant.role === "ADMIN"),
      false,
    );
    assert.equal(PILOT_SEED.people?.some((person) => person.id === "van"), true);
  });

  it("every dev account is refused every admin action, even with a forged ADMIN grant", () => {
    const world = createEmptyWorld(NOW);
    const people = PILOT_SEED.people ?? [];
    assert.equal(people.length, 12);
    for (const person of people) {
      const forged: AccessGrant = {
        id: "forged-admin",
        role: "ADMIN",
        scopeRef: null,
        status: "active",
      };
      const role = resolveWorkingRole({
        signedIn: true,
        grants: [...grantsFor(person.id), forged],
        grantId: "forged-admin",
        vai: "admin",
        key: "anything",
      });
      assert.notEqual(role.persona, "ADMIN", person.email);
      for (const action of ADMIN_ACTIONS) {
        assert.throws(
          () => applyWorldAction(world, action, role),
          (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
          `${person.email} ${action.type}`,
        );
      }
    }
  });
});

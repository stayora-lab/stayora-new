import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { DomainError, createEmptyWorld } from "./domain/engine.ts";
import { PILOT_SEED } from "./pilot-data.ts";
import { resolveWorkingRole, type AccessGrant } from "./access.ts";
import { applyWorldAction, type WorldAction } from "./world-actions.ts";
import { assertDevSignInEnabled, devSignInEnabled } from "./dev-sign-in.ts";
import { authorizeRole } from "./authorize.ts";
import {
  applyRoleGrant,
  authenticateRealIdentity,
  createRealIdentity,
  isFictionalPilotEmail,
  rolesDirectoryPayload,
  visibleSessionUser,
} from "./identity-path.ts";

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

function functionBody(file: string, name: string): string {
  const text = source(file);
  const start = text.indexOf(`export async function ${name}`);
  assert.ok(start >= 0, name);
  const next = text.indexOf("\nexport async function ", start + 1);
  return text.slice(start, next === -1 ? undefined : next);
}

describe("real sign-up is not the dev sign-in gate", () => {
  const previous = process.env.DEV_SIGN_IN;
  const pilotEmails = (PILOT_SEED.people ?? []).map((person) => person.email);

  afterEach(() => {
    if (previous === undefined) delete process.env.DEV_SIGN_IN;
    else process.env.DEV_SIGN_IN = previous;
  });

  it("creates an identity with DEV_SIGN_IN unset and grants no role", async () => {
    delete process.env.DEV_SIGN_IN;
    const identities: { id: string; email: string; name: string; passwordHash: string }[] = [];
    const grants: { role: string; status: string }[] = [];
    const user = await createRealIdentity(
      {
        findByEmail: async (email) => identities.find((item) => item.email === email) ?? null,
        insertIdentity: async (row) => {
          identities.push(row);
        },
        hashPassword: (password) => `hash:${password}`,
        newId: () => "usr_real",
      },
      {
        name: " Lan ",
        email: "Lan@Example.com",
        password: "mat-khau-1",
        pilotEmails,
      },
    );
    assert.equal(user.id, "usr_real");
    assert.equal(user.email, "lan@example.com");
    assert.equal(user.name, "Lan");
    assert.equal(identities.length, 1);
    assert.equal(grants.length, 0);
    assert.equal(
      grants.some((grant) => grant.role === "ADMIN" && grant.status === "active"),
      false,
    );
    assert.equal("role" in user, false);
  });

  it("refuses a fictional pilot email on the real path even when that account exists", async () => {
    delete process.env.DEV_SIGN_IN;
    const chi = pilotEmails[0];
    assert.ok(chi);
    let lookups = 0;
    await assert.rejects(
      () =>
        createRealIdentity(
          {
            findByEmail: async () => {
              lookups += 1;
              return { id: "dev_chi" };
            },
            insertIdentity: async () => {
              throw new Error("must not insert");
            },
            hashPassword: () => "no",
            newId: () => "usr_no",
          },
          { name: "Chi", email: ` ${chi.toUpperCase()} `, password: SHARED_PASSWORD, pilotEmails },
        ),
      /tài khoản thử/i,
    );
    await assert.rejects(
      () =>
        authenticateRealIdentity(
          {
            findByEmail: async () => {
              lookups += 1;
              return { id: "dev_chi", email: chi, name: "Chi", passwordHash: "hash" };
            },
            passwordMatches: () => true,
          },
          { email: chi, password: SHARED_PASSWORD, pilotEmails },
        ),
      /Đăng nhập thử đang tắt/,
    );
    assert.equal(lookups, 0);
    assert.equal(isFictionalPilotEmail(chi, pilotEmails), true);
    assert.equal(isFictionalPilotEmail("lan@example.com", pilotEmails), false);
  });

  it("keeps a real session when the flag is off and drops a fictional one", () => {
    delete process.env.DEV_SIGN_IN;
    const real = { id: "usr_real", email: "lan@example.com", name: "Lan" };
    const fictional = { id: "dev_chi", email: pilotEmails[0]!, name: "Chi" };
    assert.deepEqual(visibleSessionUser(real, false, pilotEmails), real);
    assert.equal(visibleSessionUser(fictional, false, pilotEmails), null);
    assert.deepEqual(visibleSessionUser(fictional, true, pilotEmails), fictional);
    assert.equal(visibleSessionUser(null, false, pilotEmails), null);
  });

  it("wires real sign-up outside the dev gate and never writes a role", () => {
    const signUp = functionBody("./dev-identity.server.ts", "signUpIdentity");
    const signIn = functionBody("./dev-identity.server.ts", "signInIdentity");
    const current = functionBody("./dev-identity.server.ts", "currentDevUser");
    const devSignIn = functionBody("./dev-identity.server.ts", "signInDev");
    assert.equal(signUp.includes("assertDevSignInEnabled"), false);
    assert.equal(signUp.includes("role_grants"), false);
    assert.equal(signUp.includes("ensureDevAccounts"), false);
    assert.match(signUp, /createRealIdentity/);
    assert.equal(signIn.includes("assertDevSignInEnabled"), false);
    assert.match(signIn, /authenticateRealIdentity/);
    assert.equal(current.includes("if (!devSignInEnabled()) return null"), false);
    assert.match(current, /visibleSessionUser/);
    assert.match(devSignIn.slice(0, devSignIn.indexOf("ensureDevAccounts")), /assertDevSignInEnabled\(\)/);
    const login = source("../routes/login.tsx");
    assert.match(login, /signUpAccount/);
    assert.equal(login.includes("signUpDevAccount"), false);
    assert.equal(login.includes("Tạo tài khoản thử"), false);
    assert.match(login, /gate\.enabled && pilot/);
    const path = source("./identity-path.ts");
    assert.equal(path.includes("devSignInEnabled"), false);
    assert.equal(path.includes("process.env"), false);
    assert.equal(path.includes("role_grants"), false);
    const grants = source("./dev-identity.server.ts");
    assert.match(grants, /status: row\.role === "ADMIN" \? "revoked" : row\.status/);
  });
});

describe("roles page does not require DEV_SIGN_IN", () => {
  const previousFlag = process.env.DEV_SIGN_IN;
  const previousKey = process.env.ADMIN_KEY;

  afterEach(() => {
    if (previousFlag === undefined) delete process.env.DEV_SIGN_IN;
    else process.env.DEV_SIGN_IN = previousFlag;
    if (previousKey === undefined) delete process.env.ADMIN_KEY;
    else process.env.ADMIN_KEY = previousKey;
  });

  it("with DEV_SIGN_IN off, an admin can grant a real account and the fictional list is empty", async () => {
    delete process.env.DEV_SIGN_IN;
    process.env.ADMIN_KEY = "roles-page-key";
    assert.equal(devSignInEnabled(), false);
    const operator = authorizeRole("admin", "roles-page-key");
    assert.equal(operator.persona, "ADMIN");
    assert.equal(authorizeRole("admin", "wrong").persona, "GUEST");
    assert.deepEqual(rolesDirectoryPayload(false, [{ email: "chi@stayora.test" }]), {
      directory: [],
      devDirectory: false,
    });
    assert.equal(rolesDirectoryPayload(true, [{ email: "chi@stayora.test" }]).devDirectory, true);

    const grants: { id: string; userId: string; role: string; scopeRef: string | null; grantedBy: string }[] = [];
    let lookups = 0;
    await applyRoleGrant(
      {
        findByEmail: async (email) => {
          lookups += 1;
          return email === "lan@example.com" ? { id: "usr_lan" } : null;
        },
        findGrant: async () => null,
        activateGrant: async () => {
          throw new Error("no existing grant");
        },
        insertGrant: async (row) => {
          grants.push(row);
        },
        newId: () => "grant_1",
      },
      {
        email: "Lan@Example.com",
        role: "HOST",
        scopeRef: " host-an ",
        operatorIsAdmin: operator.persona === "ADMIN",
        grantedBy: "ADMIN_KEY",
      },
    );
    assert.equal(lookups, 1);
    assert.equal(grants.length, 1);
    assert.equal(grants[0]?.userId, "usr_lan");
    assert.equal(grants[0]?.role, "HOST");
    assert.equal(grants[0]?.scopeRef, "host-an");
    assert.equal(grants[0]?.grantedBy, "ADMIN_KEY");
    assert.equal(grants.some((grant) => grant.role === "ADMIN"), false);

    await assert.rejects(
      () =>
        applyRoleGrant(
          {
            findByEmail: async () => {
              throw new Error("must not look up");
            },
            findGrant: async () => null,
            activateGrant: async () => undefined,
            insertGrant: async () => undefined,
            newId: () => "grant_no",
          },
          {
            email: "lan@example.com",
            role: "HOST",
            scopeRef: null,
            operatorIsAdmin: false,
            grantedBy: "no",
          },
        ),
      /Stayora vận hành/,
    );
    await assert.rejects(
      () =>
        applyRoleGrant(
          {
            findByEmail: async () => ({ id: "usr_lan" }),
            findGrant: async () => null,
            activateGrant: async () => undefined,
            insertGrant: async () => {
              throw new Error("must not grant ADMIN");
            },
            newId: () => "grant_admin",
          },
          {
            email: "lan@example.com",
            role: "ADMIN",
            scopeRef: null,
            operatorIsAdmin: true,
            grantedBy: "ADMIN_KEY",
          },
        ),
      /Stayora vận hành/,
    );
  });

  it("skips the fictional directory when the flag is off and still grants by admin key", () => {
    const page = functionBody("./dev-identity.server.ts", "rolesPageDirectory");
    assert.match(page, /if \(!devSignInEnabled\(\)\) return rolesDirectoryPayload\(false/);
    const directory = functionBody("./dev-identity.server.ts", "listDevDirectory");
    assert.match(directory, /assertDevSignInEnabled\(\)/);
    const grant = functionBody("./dev-identity.server.ts", "grantRole");
    assert.equal(grant.includes("assertDevSignInEnabled"), false);
    assert.match(grant, /authorizeRole\("admin"/);
    assert.match(grant, /applyRoleGrant/);
    const revoke = functionBody("./dev-identity.server.ts", "revokeRole");
    assert.equal(revoke.includes("assertDevSignInEnabled"), false);
    assert.match(revoke, /assertOperator/);
    const roles = source("../routes/admin_.roles.tsx");
    assert.match(roles, /Danh sách tài khoản thử không mở/);
    assert.match(roles, /lookupAccountGrants/);
    assert.equal(roles.includes("Đăng nhập thử đang tắt"), false);
  });
});

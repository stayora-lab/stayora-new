import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getCookie, getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { PILOT_SEED } from "./pilot-data.ts";
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
import {
  ACCOUNT_SEARCH_LIMIT,
  accountSearchQuery,
  type AccountSearchHit,
} from "./account-lookup.ts";
import { planRoleGrants } from "./grant-scope.ts";
import type { Persona } from "./domain/types.ts";
import type { DevGrantRow, DevUser } from "./dev-types.ts";

const COOKIE = "stayora_dev_session";
const DEMO_COOKIE = "stayora_demo";
const SESSION_DAYS = 14;

/** Shared test password. Server-only — returned to the browser only when DEV_SIGN_IN is on. */
const DEV_PASSWORD = "Stayora-thu-1";

export type { DevGrantRow, DevUser };

export function readDevSignInGate():
  | { enabled: false }
  | { enabled: true; password: string } {
  if (!devSignInEnabled()) return { enabled: false };
  return { enabled: true, password: DEV_PASSWORD };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function passwordMatches(password: string, stored: string): boolean {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = getRequest()?.url.startsWith("https:") ? "; Secure" : "";
  setResponseHeader(
    "Set-Cookie",
    `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  );
}

export function demoCookieOn(): boolean {
  return getCookie(DEMO_COOKIE) === "1";
}

export function armDemoCookie() {
  writeCookie(DEMO_COOKIE, "1", 60 * 60 * 24 * 7);
}

export async function ensureDevAccounts(): Promise<void> {
  assertDevSignInEnabled();
  const people = PILOT_SEED.people ?? [];
  const sql = await getSql();
  await sql`
    update role_grants
    set status = 'revoked', granted_by = 'seed', granted_at = now()
    where role = 'ADMIN'
      and status = 'active'
      and user_id in (select id from dev_identity)
  `;
  for (const person of people) {
    const existing = await sql<{ id: string }>`
      select id from dev_identity where email = ${person.email}
    `;
    const userId = existing[0]?.id ?? `dev_${person.id}`;
    if (!existing[0]) {
      await sql`
        insert into dev_identity (id, email, name, password_hash)
        values (${userId}, ${person.email}, ${person.name}, ${hashPassword(DEV_PASSWORD)})
      `;
    }
    for (const grant of (PILOT_SEED.grants ?? []).filter((item) => item.personId === person.id)) {
      if (grant.role === "ADMIN") continue;
      const found = await sql<{ id: string }>`
        select id from role_grants
        where user_id = ${userId}
          and role = ${grant.role}
          and scope_ref is not distinct from ${grant.scopeRef}
      `;
      if (found[0]) continue;
      await sql`
        insert into role_grants (id, user_id, role, scope_ref, status, granted_by, granted_at)
        values (
          ${`grant_${person.id}_${grant.role}_${grant.scopeRef ?? "all"}`},
          ${userId},
          ${grant.role},
          ${grant.scopeRef},
          'active',
          'seed',
          now()
        )
      `;
    }
  }
}

async function userByEmail(email: string): Promise<(DevUser & { passwordHash: string }) | null> {
  const sql = await getSql();
  const rows = await sql<{ id: string; email: string; name: string; password_hash: string }>`
    select id, email, name, password_hash from dev_identity where email = ${email.trim().toLowerCase()}
  `;
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, passwordHash: row.password_hash };
}

async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const sql = await getSql();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    insert into dev_session (token_hash, user_id, expires_at)
    values (${tokenHash(token)}, ${userId}, ${expires})
  `;
  writeCookie(COOKIE, token, SESSION_DAYS * 24 * 60 * 60);
}

function pilotEmails(): string[] {
  return (PILOT_SEED.people ?? []).map((person) => person.email);
}

export async function signUpIdentity(input: {
  name: string;
  email: string;
  password: string;
}): Promise<DevUser> {
  const user = await createRealIdentity(
    {
      findByEmail: async (email) => userByEmail(email),
      insertIdentity: async (row) => {
        const sql = await getSql();
        await sql`
          insert into dev_identity (id, email, name, password_hash)
          values (${row.id}, ${row.email}, ${row.name}, ${row.passwordHash})
        `;
      },
      hashPassword,
      newId: () => `usr_${randomBytes(8).toString("hex")}`,
    },
    { ...input, pilotEmails: pilotEmails() },
  );
  await startSession(user.id);
  return user;
}

export async function signInIdentity(email: string, password: string): Promise<DevUser> {
  const user = await authenticateRealIdentity(
    {
      findByEmail: userByEmail,
      passwordMatches,
    },
    { email, password, pilotEmails: pilotEmails() },
  );
  await startSession(user.id);
  return user;
}

export async function signUpDev(input: {
  name: string;
  email: string;
  password: string;
}): Promise<DevUser> {
  assertDevSignInEnabled();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!name || !email.includes("@") || input.password.length < 8) {
    throw new Error("Email, tên và mật khẩu (tối thiểu 8 ký tự) là bắt buộc");
  }
  await ensureDevAccounts();
  const existing = await userByEmail(email);
  if (existing) throw new Error("Email này đã có tài khoản thử");
  const id = `dev_${randomBytes(8).toString("hex")}`;
  const sql = await getSql();
  await sql`
    insert into dev_identity (id, email, name, password_hash)
    values (${id}, ${email}, ${name}, ${hashPassword(input.password)})
  `;
  await startSession(id);
  return { id, email, name };
}

export async function signInDev(email: string, password: string): Promise<DevUser> {
  assertDevSignInEnabled();
  await ensureDevAccounts();
  const user = await userByEmail(email);
  if (!user || !passwordMatches(password, user.passwordHash)) {
    throw new Error("Email hoặc mật khẩu không đúng");
  }
  await startSession(user.id);
  return { id: user.id, email: user.email, name: user.name };
}

export async function signOutDev(): Promise<void> {
  const token = getCookie(COOKIE);
  if (token) {
    const sql = await getSql();
    await sql`delete from dev_session where token_hash = ${tokenHash(token)}`;
  }
  writeCookie(COOKIE, "", 0);
}

export async function currentDevUser(): Promise<DevUser | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const sql = await getSql();
  const rows = await sql<{ id: string; email: string; name: string }>`
    select u.id, u.email, u.name
    from dev_session s
    join dev_identity u on u.id = s.user_id
    where s.token_hash = ${tokenHash(token)}
      and s.expires_at > now()
  `;
  return visibleSessionUser(rows[0] ?? null, devSignInEnabled(), pilotEmails());
}

export async function grantsForUser(userId: string): Promise<DevGrantRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    role: Persona;
    scope_ref: string | null;
    status: "active" | "revoked";
    granted_by: string | null;
    granted_at: string | Date;
  }>`
    select id, user_id, role, scope_ref, status, granted_by, granted_at
    from role_grants
    where user_id = ${userId}
    order by granted_at asc
  `;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    scopeRef: row.scope_ref,
    status: row.role === "ADMIN" ? "revoked" : row.status,
    grantedBy: row.granted_by,
    grantedAt:
      typeof row.granted_at === "string" ? row.granted_at : new Date(row.granted_at).toISOString(),
  }));
}

export async function listDevDirectory(): Promise<
  { user: DevUser; grants: DevGrantRow[] }[]
> {
  assertDevSignInEnabled();
  await ensureDevAccounts();
  const sql = await getSql();
  const users = await sql<{ id: string; email: string; name: string }>`
    select id, email, name from dev_identity order by name
  `;
  const result = [];
  for (const user of users) {
    if (!isFictionalPilotEmail(user.email, pilotEmails())) continue;
    result.push({ user, grants: await grantsForUser(user.id) });
  }
  return result;
}

/** Roles page data. The fictional directory is skipped when test sign-in is off. */
export async function rolesPageDirectory(): Promise<{
  directory: { user: DevUser; grants: DevGrantRow[] }[];
  devDirectory: boolean;
}> {
  if (!devSignInEnabled()) return rolesDirectoryPayload(false, []);
  return rolesDirectoryPayload(true, await listDevDirectory());
}

function assertOperator(key: string | null | undefined): void {
  if (authorizeRole("admin", key).persona !== "ADMIN") {
    throw new Error("Chỉ Stayora vận hành được cấp vai trò");
  }
}

export async function accountGrantsForOperator(
  email: string,
  key?: string | null,
): Promise<{ user: DevUser; grants: DevGrantRow[] }> {
  assertOperator(key);
  const user = await userByEmail(email);
  if (!user) throw new Error("Không thấy tài khoản này");
  return {
    user: { id: user.id, email: user.email, name: user.name },
    grants: await grantsForUser(user.id),
  };
}

/**
 * Live search of dev_identity. Admin key only — same gate as granting a role.
 * Does not read the fictional roster and does not require DEV_SIGN_IN.
 * Predicate matches matchAccounts: substring of lower(email) or lower(name).
 */
export async function searchAccountsForOperator(
  query: string,
  key?: string | null,
): Promise<{ status: "short" | "empty" | "ready"; accounts: AccountSearchHit[] }> {
  assertOperator(key);
  const decision = accountSearchQuery(query);
  if (!decision.ready) return { status: "short", accounts: [] };
  const sql = await getSql();
  const rows = await sql<{ id: string; email: string; name: string }>`
    select id, email, name
    from dev_identity
    where strpos(lower(email), ${decision.needle}) > 0
       or strpos(lower(name), ${decision.needle}) > 0
    order by email
    limit ${ACCOUNT_SEARCH_LIMIT}
  `;
  const accounts = rows.map((row) => ({ id: row.id, email: row.email, name: row.name }));
  return { status: accounts.length > 0 ? "ready" : "empty", accounts };
}

export async function grantRole(input: {
  email: string;
  role: string;
  villaIds?: string[];
  key?: string | null;
}): Promise<void> {
  const operatorIsAdmin = authorizeRole("admin", input.key).persona === "ADMIN";
  if (!operatorIsAdmin) throw new Error("Chỉ Stayora vận hành được cấp vai trò");
  const target = await userByEmail(input.email);
  if (!target) throw new Error("Không thấy tài khoản này");
  const planned = planRoleGrants({
    role: input.role,
    villaIds: input.villaIds,
    knownVillaIds: PILOT_SEED.villas.map((villa) => villa.id),
    accountId: target.id,
  });
  const sql = await getSql();
  for (const item of planned) {
    await applyRoleGrant(
      {
        findByEmail: async (email) => {
          const user = await userByEmail(email);
          return user ? { id: user.id } : null;
        },
        findGrant: async (userId, role, scopeRef) => {
          const existing = await sql<{ id: string }>`
            select id from role_grants
            where user_id = ${userId}
              and role = ${role}
              and scope_ref is not distinct from ${scopeRef}
          `;
          return existing[0] ?? null;
        },
        activateGrant: async (id, grantedBy) => {
          await sql`
            update role_grants
            set status = 'active', granted_by = ${grantedBy}, granted_at = now()
            where id = ${id}
          `;
        },
        insertGrant: async (row) => {
          await sql`
            insert into role_grants (id, user_id, role, scope_ref, status, granted_by, granted_at)
            values (
              ${row.id},
              ${row.userId},
              ${row.role},
              ${row.scopeRef},
              'active',
              ${row.grantedBy},
              now()
            )
          `;
        },
        newId: () => `grant_${randomBytes(6).toString("hex")}`,
      },
      {
        email: input.email,
        role: input.role,
        scopeRef: item.scopeRef,
        operatorIsAdmin: true,
        grantedBy: "ADMIN_KEY",
      },
    );
  }
}

export async function revokeRole(grantId: string, key?: string | null): Promise<void> {
  assertOperator(key);
  const sql = await getSql();
  await sql`
    update role_grants
    set status = 'revoked', granted_by = 'ADMIN_KEY', granted_at = now()
    where id = ${grantId}
  `;
}

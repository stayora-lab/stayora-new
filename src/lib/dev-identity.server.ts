import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getCookie, getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";
import { DEV_PASSWORD, PILOT_SEED } from "./pilot-data.ts";
import type { Persona } from "./domain/types.ts";
import type { DevGrantRow, DevUser } from "./dev-types.ts";

const COOKIE = "stayora_dev_session";
const DEMO_COOKIE = "stayora_demo";
const SESSION_DAYS = 14;

export type { DevGrantRow, DevUser };

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
  const people = PILOT_SEED.people ?? [];
  const sql = await getSql();
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

export async function signUpDev(input: {
  name: string;
  email: string;
  password: string;
}): Promise<DevUser> {
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
  return rows[0] ?? null;
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
    status: row.status,
    grantedBy: row.granted_by,
    grantedAt:
      typeof row.granted_at === "string" ? row.granted_at : new Date(row.granted_at).toISOString(),
  }));
}

export async function listDevDirectory(): Promise<
  { user: DevUser; grants: DevGrantRow[] }[]
> {
  await ensureDevAccounts();
  const sql = await getSql();
  const users = await sql<{ id: string; email: string; name: string }>`
    select id, email, name from dev_identity order by name
  `;
  const result = [];
  for (const user of users) {
    result.push({ user, grants: await grantsForUser(user.id) });
  }
  return result;
}

async function requireAdmin(): Promise<DevUser> {
  const user = await currentDevUser();
  if (!user) throw new Error("Cần đăng nhập");
  const grants = await grantsForUser(user.id);
  if (!grants.some((grant) => grant.status === "active" && grant.role === "ADMIN")) {
    throw new Error("Chỉ Stayora vận hành được cấp vai trò");
  }
  return user;
}

const ROLES = new Set(["HOST", "SALE", "BUTLER", "BQL", "ADMIN", "GUEST"]);

export async function grantRole(input: {
  email: string;
  role: string;
  scopeRef: string | null;
}): Promise<void> {
  const admin = await requireAdmin();
  if (!ROLES.has(input.role) || input.role === "GUEST") throw new Error("Vai trò không hợp lệ");
  const target = await userByEmail(input.email);
  if (!target) throw new Error("Không thấy tài khoản này");
  const scope = input.scopeRef?.trim() || null;
  const sql = await getSql();
  const existing = await sql<{ id: string }>`
    select id from role_grants
    where user_id = ${target.id}
      and role = ${input.role}
      and scope_ref is not distinct from ${scope}
  `;
  if (existing[0]) {
    await sql`
      update role_grants
      set status = 'active', granted_by = ${admin.id}, granted_at = now()
      where id = ${existing[0].id}
    `;
    return;
  }
  await sql`
    insert into role_grants (id, user_id, role, scope_ref, status, granted_by, granted_at)
    values (
      ${`grant_${randomBytes(6).toString("hex")}`},
      ${target.id},
      ${input.role},
      ${scope},
      'active',
      ${admin.id},
      now()
    )
  `;
}

export async function revokeRole(grantId: string): Promise<void> {
  const admin = await requireAdmin();
  const sql = await getSql();
  await sql`
    update role_grants
    set status = 'revoked', granted_by = ${admin.id}, granted_at = now()
    where id = ${grantId}
  `;
}

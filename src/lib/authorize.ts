import { timingSafeEqual } from "node:crypto";
import { env } from "./env.server.ts";
import { parseVai, type RoleSession } from "./role.ts";

export function isAdminConfigured(): boolean {
  return Boolean(env("ADMIN_KEY"));
}

function expectedAdminKey(): string | undefined {
  return env("ADMIN_KEY");
}

function adminKeyMatches(provided: string | null | undefined): boolean {
  if (!provided) return false;
  const expected = expectedAdminKey();
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Re-derive a requested vai. The client-sent role is never stored here.
 * ADMIN without a matching ADMIN_KEY is GUEST. Other personas only parse:
 * demo mode must still pass the same key check in resolveWorkingRole.
 */
export function authorizeRole(
  vai: string | null | undefined,
  key?: string | null,
): RoleSession {
  const parsed = parseVai(vai);
  if (!parsed) return { persona: "GUEST" };
  if (parsed.persona === "ADMIN" && !adminKeyMatches(key)) {
    return { persona: "GUEST" };
  }
  return parsed;
}

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
 * Re-derive the role on the server. The client-sent RoleSession is never trusted.
 * Unset ADMIN_KEY or a wrong/missing key → GUEST (fail closed).
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

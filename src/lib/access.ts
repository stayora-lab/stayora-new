import type { Persona } from "./domain/types.ts";
import { authorizeRole } from "./authorize.ts";
import { roleFromGrant, type RoleSession } from "./role.ts";

export type AccessGrant = {
  id: string;
  role: Persona;
  scopeRef: string | null;
  status: "active" | "revoked";
};

export { roleFromGrant };

/**
 * Signed-in callers are authorized only by active grants.
 * A client-sent vai/role is ignored whenever an identity is present.
 * Unsigned demo (?demo=1) may still use vai. Otherwise the caller is a guest.
 */
export function resolveWorkingRole(input: {
  signedIn: boolean;
  grants: AccessGrant[];
  grantId?: string | null;
  demo?: boolean;
  vai?: string | null;
  key?: string | null;
}): RoleSession {
  if (input.signedIn) {
    const active = input.grants.filter((grant) => grant.status === "active");
    const chosen = input.grantId
      ? active.find((grant) => grant.id === input.grantId)
      : active[0];
    return chosen ? roleFromGrant(chosen.role, chosen.scopeRef) : { persona: "GUEST" };
  }
  if (input.demo) return authorizeRole(input.vai, input.key);
  return { persona: "GUEST" };
}

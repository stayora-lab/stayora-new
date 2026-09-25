import type { Persona } from "./domain/types.ts";
import { authorizeRole } from "./authorize.ts";
import { roleFromGrant, workingRoleFromGrants, type RoleSession } from "./role.ts";

export type AccessGrant = {
  id: string;
  role: Persona;
  scopeRef: string | null;
  status: "active" | "revoked";
};

export { roleFromGrant };

/**
 * Signed-in callers are authorized only by active grants, and never as ADMIN.
 * Stayora vận hành is the ADMIN_KEY path only (unsigned + demo).
 * A client-sent vai/role is ignored whenever an identity is present.
 * Otherwise the caller is a guest.
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
    const active = input.grants.filter(
      (grant) => grant.status === "active" && grant.role !== "ADMIN",
    );
    const chosen = input.grantId
      ? active.find((grant) => grant.id === input.grantId)
      : active[0];
    return chosen ? workingRoleFromGrants(active, chosen.role) : { persona: "GUEST" };
  }
  if (input.demo) return authorizeRole(input.vai, input.key);
  return { persona: "GUEST" };
}

import type { Persona } from "./domain/types.ts";
import { authorizeRole } from "./authorize.ts";
import { roleFromGrant, workingRoleFromGrants, isCapabilityGrant, type RoleSession } from "./role.ts";

export type AccessGrant = {
  id: string;
  role: Persona;
  scopeRef: string | null;
  status: "active" | "revoked";
};

export { roleFromGrant };

/**
 * Signed-in callers are authorized only by active grants, and never as ADMIN.
 * Unsigned demo mode uses the ADMIN_KEY path for every non-guest persona.
 * The demo cookie is not a credential. A client-sent vai is ignored when an
 * identity is present. Otherwise the caller is a guest.
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
    const personas = active.filter((grant) => !isCapabilityGrant(grant.role));
    const chosen = input.grantId
      ? personas.find((grant) => grant.id === input.grantId)
      : personas[0];
    return chosen ? workingRoleFromGrants(active, chosen.role) : { persona: "GUEST" };
  }
  if (input.demo) {
    const requested = authorizeRole(input.vai, input.key);
    if (requested.persona !== "GUEST" && authorizeRole("admin", input.key).persona !== "ADMIN") {
      return { persona: "GUEST" };
    }
    return requested;
  }
  return { persona: "GUEST" };
}

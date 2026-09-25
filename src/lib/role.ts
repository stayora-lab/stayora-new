import type { Actor, Persona } from "./domain/types.ts";
import { PILOT_SEED } from "./pilot-data.ts";

export type RoleSession = {
  persona: Persona;
  saleId?: string;
  hostId?: string;
  butlerId?: string;
  /** Villas granted to this role, one grant each. Legacy person ids stay on hostId/butlerId. */
  villaIds?: string[];
};

export const ROLE_STORAGE_KEY = "stayora-role";

const WORKSPACE: Record<Persona, string> = {
  GUEST: "/",
  SALE: "/sale",
  HOST: "/host",
  BUTLER: "/ops",
  BQL: "/ops",
  ADMIN: "/admin",
};

export function roleFromGrant(role: Persona, scopeRef: string | null): RoleSession {
  if (role === "HOST") return { persona: "HOST", hostId: scopeRef ?? undefined };
  if (role === "SALE") return { persona: "SALE", saleId: scopeRef ?? undefined };
  if (role === "BUTLER") return { persona: "BUTLER", butlerId: scopeRef ?? undefined };
  if (role === "BQL") return { persona: "BQL" };
  if (role === "ADMIN") return { persona: "ADMIN" };
  return { persona: "GUEST" };
}

const VILLA_IDS = new Set(PILOT_SEED.villas.map((villa) => villa.id));

/** Every active grant of the chosen role. Villa scopes accumulate; they are not truncated. */
export function workingRoleFromGrants(
  grants: { role: Persona; scopeRef: string | null; status: "active" | "revoked" }[],
  role: Persona,
): RoleSession {
  const scopes = grants
    .filter((grant) => grant.status === "active" && grant.role === role)
    .map((grant) => grant.scopeRef);
  const villaIds = scopes.filter((id): id is string => Boolean(id && VILLA_IDS.has(id)));
  const legacy = scopes.find((id) => id && !VILLA_IDS.has(id)) ?? undefined;
  if (role === "HOST") return { persona: "HOST", hostId: legacy, villaIds };
  if (role === "BUTLER") {
    return { persona: "BUTLER", butlerId: legacy ?? (villaIds.length ? "granted" : undefined), villaIds };
  }
  if (role === "SALE") {
    return { persona: "SALE", saleId: legacy ?? scopes.find((id): id is string => Boolean(id)) };
  }
  if (role === "BQL") return { persona: "BQL" };
  if (role === "ADMIN") return { persona: "ADMIN" };
  return { persona: "GUEST" };
}

export function workspaceFor(persona: Persona): string {
  return WORKSPACE[persona];
}

export function parseVai(raw: string | null | undefined): RoleSession | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "khach" || value === "guest") return { persona: "GUEST" };
  if (value === "bql") return { persona: "BQL" };
  if (value === "admin") return { persona: "ADMIN" };
  if (value.startsWith("sale-")) return { persona: "SALE", saleId: raw.trim() };
  if (value.startsWith("host-")) return { persona: "HOST", hostId: raw.trim() };
  if (value.startsWith("butler-")) return { persona: "BUTLER", butlerId: raw.trim() };
  return null;
}

export function vaiFor(role: RoleSession): string {
  if (role.persona === "GUEST") return "khach";
  if (role.persona === "SALE") return role.saleId ?? "sale";
  if (role.persona === "HOST") return role.hostId ?? "host";
  if (role.persona === "BUTLER") return role.butlerId ?? "butler";
  if (role.persona === "BQL") return "bql";
  return "admin";
}

export function actorFromRole(role: RoleSession): Actor {
  if (role.persona === "SALE") return { persona: "SALE", saleId: role.saleId ?? "" };
  if (role.persona === "BUTLER") {
    return {
      persona: "BUTLER",
      butlerId: role.butlerId ?? "",
      assignedVillaIds: role.villaIds,
    };
  }
  if (role.persona === "HOST") return { persona: "HOST" };
  if (role.persona === "BQL") return { persona: "BQL" };
  if (role.persona === "ADMIN") return { persona: "ADMIN" };
  return { persona: "GUEST" };
}

export function roleLinks(): { label: string; vai: string; path: string }[] {
  const links = [
    { label: "Khách", vai: "khach", path: "/" },
    ...PILOT_SEED.sales.map((person) => ({
      label: `Sale · ${person.name}`,
      vai: person.id,
      path: "/sale",
    })),
    ...PILOT_SEED.hosts.map((person) => ({
      label: `Host · ${person.name}`,
      vai: person.id,
      path: "/host",
    })),
    ...PILOT_SEED.butlers.map((person) => ({
      label: `Butler · ${person.name}`,
      vai: person.id,
      path: "/ops",
    })),
    { label: "BQL", vai: "bql", path: "/ops" },
    { label: "Stayora vận hành", vai: "admin", path: "/admin" },
  ];
  return links;
}

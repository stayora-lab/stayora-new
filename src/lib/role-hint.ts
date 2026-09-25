import { butlerFieldBoard, hostToday, opsLists } from "./domain/index.ts";
import type { Persona, World } from "./domain/types.ts";

const WORK_ROLES = ["HOST", "SALE", "BUTLER", "BQL"] as const;

export type WorkRole = (typeof WORK_ROLES)[number];

export type HintGrant = {
  id: string;
  role: string;
  scopeRef: string | null;
  status: "active" | "revoked";
};

export type RoleHint = {
  role: WorkRole;
  label: string;
  grantId: string;
};

export function workRoleLabel(role: WorkRole): string {
  if (role === "HOST") return "Chủ nhà";
  if (role === "SALE") return "Sale";
  if (role === "BUTLER") return "Quản gia";
  return "BQL";
}

function isWorkRole(role: string): role is WorkRole {
  return (WORK_ROLES as readonly string[]).includes(role);
}

function scopes(grants: readonly HintGrant[], role: WorkRole, known: ReadonlySet<string>): string[] {
  return grants
    .filter((grant) => grant.status === "active" && grant.role === role && grant.scopeRef)
    .map((grant) => grant.scopeRef as string)
    .filter((id) => (role === "SALE" ? true : known.has(id)));
}

function countStays(world: World, villaIds: readonly string[], today: string): number {
  const mine = new Set(villaIds);
  const lists = opsLists(world, today);
  return [...lists.arriving, ...lists.departing, ...lists.inHouse].filter((stay) =>
    mine.has(stay.villaId),
  ).length;
}

/** Items the role's own today surface would show. Zero means the board is empty. */
export function roleItemCount(
  world: World,
  role: WorkRole,
  villaIds: readonly string[],
  saleIds: readonly string[],
  today: string,
): number {
  if (role === "SALE") {
    const mine = new Set(saleIds);
    return world.requests.filter(
      (request) =>
        request.saleId &&
        mine.has(request.saleId) &&
        (request.status === "PENDING" || request.status === "ACCEPTED"),
    ).length;
  }
  if (role === "BQL") {
    const board = butlerFieldBoard(world, today, villaIds);
    const open = (world.conflicts ?? []).filter((item) => item.status === "OPEN").length;
    return board.arriving.length + board.departing.length + board.inHouse.length + open;
  }
  if (role === "BUTLER") {
    const board = butlerFieldBoard(world, today, villaIds);
    const holds = (world.protectiveHolds ?? []).filter(
      (hold) => hold.status === "ACTIVE" && villaIds.includes(hold.villaId),
    ).length;
    return board.arriving.length + board.departing.length + board.inHouse.length + holds;
  }
  const mine = new Set(villaIds);
  const summary = hostToday(world, today);
  const stays = countStays(world, villaIds, today);
  const pending = summary.pending.filter((item) => mine.has(item.villaId)).length;
  const conflicts = summary.openConflicts.filter((item) => mine.has(item.villaId)).length;
  const holds = (world.protectiveHolds ?? []).filter(
    (hold) => hold.status === "ACTIVE" && mine.has(hold.villaId),
  ).length;
  const incidents = world.incidents.filter((item) => mine.has(item.villaId)).length;
  const reports = (world.externalReports ?? []).filter(
    (item) => !item.factId && mine.has(item.villaId),
  ).length;
  const facts = (world.externalAccommodations ?? []).filter(
    (item) => !item.commitmentId && mine.has(item.villaId),
  ).length;
  return stays + pending + conflicts + holds + incidents + reports + facts;
}

/**
 * Signed-in accounts with more than one role. When the role they are looking
 * at has nothing today, point at the other role that does. One role, or a
 * role that already has items, gets no hint.
 */
export function emptyRoleHint(input: {
  grants: readonly HintGrant[];
  current: Persona;
  world: World;
  today: string;
  knownVillaIds: readonly string[];
}): RoleHint[] | null {
  if (!isWorkRole(input.current)) return null;
  const active = input.grants.filter((grant) => grant.status === "active" && isWorkRole(grant.role));
  const roles = [...new Set(active.map((grant) => grant.role as WorkRole))];
  if (roles.length < 2) return null;
  const known = new Set(input.knownVillaIds);
  const count = (role: WorkRole) =>
    roleItemCount(
      input.world,
      role,
      role === "BQL" ? input.knownVillaIds : scopes(active, role, known),
      role === "SALE" ? scopes(active, role, known) : [],
      input.today,
    );
  if (count(input.current) > 0) return null;
  const others = roles.filter((role) => role !== input.current && count(role) > 0);
  if (others.length === 0) return null;
  return others.map((role) => ({
    role,
    label: workRoleLabel(role),
    grantId: active.find((grant) => grant.role === role)!.id,
  }));
}

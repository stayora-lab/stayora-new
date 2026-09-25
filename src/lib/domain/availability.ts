import { nightsBetween, requireVilla } from "./catalog.ts";
import type { Commitment, InventoryConflict, World } from "./types.ts";

export function rangesOverlap(start: string, end: string, otherStart: string, otherEnd: string) {
  return start < otherEnd && end > otherStart;
}

export function isHoldActive(commitment: Commitment, now: string): boolean {
  if (commitment.kind !== "HOLD") return false;
  if (commitment.status !== "ACTIVE") return false;
  if (commitment.expiresAt && commitment.expiresAt <= now) return false;
  return true;
}

export function activeCommitments(world: World): Commitment[] {
  return world.commitments.filter((commitment) => {
    if (commitment.status !== "ACTIVE") return false;
    if (commitment.kind === "HOLD" && !isHoldActive(commitment, world.now)) return false;
    return true;
  });
}

export function commitmentsOverlap(
  world: World,
  villaId: string,
  start: string,
  end: string,
): boolean {
  return activeCommitments(world).some(
    (commitment) =>
      commitment.villaId === villaId &&
      rangesOverlap(start, end, commitment.start, commitment.end),
  );
}

export function isAvailable(
  world: World,
  villaId: string,
  checkIn: string,
  checkOut: string,
): boolean {
  if (nightsBetween(checkIn, checkOut) < 1) return false;
  try {
    requireVilla(villaId);
  } catch {
    return false;
  }
  return (
    !commitmentsOverlap(world, villaId, checkIn, checkOut) &&
    !activeProtectiveHolds(world).some(
      (hold) =>
        hold.villaId === villaId && rangesOverlap(checkIn, checkOut, hold.start, hold.end),
    )
  );
}

export function occupiedRanges(world: World, villaId: string): { start: string; end: string }[] {
  return activeCommitments(world)
    .filter((commitment) => commitment.villaId === villaId)
    .map((commitment) => ({ start: commitment.start, end: commitment.end }));
}

export function overlappingActive(world: World): [Commitment, Commitment][] {
  const active = activeCommitments(world);
  const pairs: [Commitment, Commitment][] = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i]!;
      const b = active[j]!;
      if (a.villaId !== b.villaId) continue;
      if (rangesOverlap(a.start, a.end, b.start, b.end)) pairs.push([a, b]);
    }
  }
  return pairs;
}

export function activeProtectiveHolds(world: World) {
  return (world.protectiveHolds ?? []).filter((hold) => hold.status === "ACTIVE");
}

export function protectiveHoldsOnDate(world: World, villaId: string, date: string) {
  return activeProtectiveHolds(world).filter(
    (hold) => hold.villaId === villaId && hold.start <= date && date < hold.end,
  );
}

export function commitmentsOnDate(world: World, villaId: string, date: string): Commitment[] {
  return activeCommitments(world).filter(
    (commitment) =>
      commitment.villaId === villaId && commitment.start <= date && date < commitment.end,
  );
}

export function openConflictsCovering(
  world: World,
  villaId: string,
  start: string,
  end: string,
): InventoryConflict[] {
  return (world.conflicts ?? []).filter((conflict) => {
    if (conflict.status !== "OPEN" || conflict.villaId !== villaId) return false;
    return conflict.commitmentIds.some((id) => {
      const commitment = world.commitments.find((item) => item.id === id);
      return commitment ? rangesOverlap(start, end, commitment.start, commitment.end) : false;
    });
  });
}

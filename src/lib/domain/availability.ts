import { nightsBetween, requireVilla } from "./catalog.ts";
import type { Commitment, World } from "./types.ts";

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
  return !activeCommitments(world).some(
    (commitment) =>
      commitment.villaId === villaId &&
      rangesOverlap(checkIn, checkOut, commitment.start, commitment.end),
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

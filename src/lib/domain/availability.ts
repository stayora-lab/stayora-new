import { differenceInCalendarDays, parseISO } from "date-fns";
import { getVilla } from "../villas.ts";
import type { Commitment, World } from "./types.ts";

function nightsBetween(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

function rangesOverlap(start: string, end: string, otherStart: string, otherEnd: string) {
  return start < otherEnd && end > otherStart;
}

export function isHoldActive(commitment: Commitment, now: string): boolean {
  if (commitment.kind !== "HOLD") return false;
  return true;
}

export function activeCommitments(world: World): Commitment[] {
  const expiredHolds = new Set(
    world.requests
      .filter(
        (request) =>
          request.status === "EXPIRED" ||
          (request.status === "ACCEPTED" &&
            request.holdExpiresAt &&
            request.holdExpiresAt <= world.now),
      )
      .map((request) => request.id),
  );

  return world.commitments.filter((commitment) => {
    if (commitment.kind === "CONFIRMED_ACCOMMODATION") return true;
    if (commitment.kind === "HOLD") {
      if (!commitment.requestId) return true;
      if (expiredHolds.has(commitment.requestId)) return false;
      const request = world.requests.find((item) => item.id === commitment.requestId);
      if (!request) return false;
      if (request.status !== "ACCEPTED") return false;
      if (request.holdExpiresAt && request.holdExpiresAt <= world.now) return false;
      return true;
    }
    return false;
  });
}

export function isAvailable(
  world: World,
  villaId: string,
  checkIn: string,
  checkOut: string,
): boolean {
  if (nightsBetween(checkIn, checkOut) < 1) return false;
  const villa = getVilla(villaId);
  if (!villa) return false;
  if (villa.blocked.some((block) => rangesOverlap(checkIn, checkOut, block.start, block.end))) {
    return false;
  }
  return !activeCommitments(world).some(
    (commitment) =>
      commitment.villaId === villaId &&
      rangesOverlap(checkIn, checkOut, commitment.start, commitment.end),
  );
}

export function occupiedRanges(world: World, villaId: string): { start: string; end: string }[] {
  const villa = getVilla(villaId);
  const blocked = villa?.blocked.map((block) => ({ start: block.start, end: block.end })) ?? [];
  const committed = activeCommitments(world)
    .filter((commitment) => commitment.villaId === villaId)
    .map((commitment) => ({ start: commitment.start, end: commitment.end }));
  return [...blocked, ...committed];
}

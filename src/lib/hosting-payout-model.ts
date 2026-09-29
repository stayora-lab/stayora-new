/**
 * Client-safe cohort rule for ADR-P076. No database and no money movement.
 *
 * The ADR's cohort is bookings CONFIRMED before the transfer becomes EFFECTIVE
 * whose Stay/check-in occurs after effectiveness. One choice covers that whole
 * attributable set. A booking that already has a RETAIN row is not attributable
 * to the later outgoing Primary.
 *
 * PROTOTYPE ASSUMPTION: "before" is a strict string comparison of the stored
 * timestamps. Equal instants are not before. ISO-8601 UTC strings sort in time
 * order; this does not apply a timezone or midnight snapshot.
 *
 * PROTOTYPE ASSUMPTION: "Stay/check-in occurs after effectiveness" means the
 * stay has not yet checked in at that instant (no checkedInAt, and status is
 * not CHECKED_IN, CHECKED_OUT, or COMPLETED). The scheduled check-in date is
 * not the test. The ADR forbids substituting a calendar snapshot for the
 * actual check-in event.
 *
 * PROTOTYPE ASSUMPTION: a stay already CANCELLED or DID_NOT_OCCUR will not
 * check in after effectiveness, so it is outside the cohort. The ADR names
 * cancelled bookings and completed or already checked-in stays, and does not
 * name DID_NOT_OCCUR. A CONFIRMED booking with no paired stay is outside the
 * cohort because check-in cannot be observed.
 */

export const PAYOUT_RETAIN = "RETAIN";
export const PAYOUT_FOLLOW_INCOMING = "FOLLOW_INCOMING";

export type PayoutChoice = typeof PAYOUT_RETAIN | typeof PAYOUT_FOLLOW_INCOMING;

/** Shown to operations. Information only. Not a pay action. */
export const PAYOUT_MANUAL_NOTE =
  "Ghi nhận để vận hành trả thủ công. Không thực hiện chuyển khoản.";

export type CohortBooking = {
  id: string;
  villaId: string;
  reference: string;
  guestName: string;
  status: string;
  confirmedAt: string;
  stayId: string;
  checkIn: string;
};

export type CohortStay = {
  id: string;
  villaId: string;
  status: string;
  checkedInAt?: string | null;
  bookingId?: string | null;
};

export type RetainedPayout = {
  bookingId: string;
  retainedIdentityId: string;
  retainedName?: string | null;
};

export type PayoutLine = {
  bookingId: string;
  guestName: string;
  reference: string;
  checkIn: string;
  kind: "attributable" | "retained-locked" | "excluded";
  reason: string;
  retainedIdentityId: string | null;
  retainedName: string | null;
};

const PAST_CHECK_IN = new Set(["CHECKED_IN", "CHECKED_OUT", "COMPLETED"]);

function stayFor(booking: CohortBooking, stays: readonly CohortStay[]): CohortStay | undefined {
  return stays.find((stay) => stay.id === booking.stayId || stay.bookingId === booking.id);
}

function retainedName(row: RetainedPayout): string {
  const name = row.retainedName?.trim();
  return name || row.retainedIdentityId;
}

/**
 * Classify one unit's bookings at a candidate effectiveness instant.
 * Other units are omitted. Future requests are not bookings and are omitted.
 */
export function classifyTransferCohort(input: {
  unitId: string;
  effectiveAt: string;
  bookings: readonly CohortBooking[];
  stays: readonly CohortStay[];
  retained: readonly RetainedPayout[];
}): PayoutLine[] {
  const retainedById = new Map(input.retained.map((row) => [row.bookingId, row]));
  const lines: PayoutLine[] = [];
  for (const booking of input.bookings) {
    if (booking.villaId !== input.unitId) continue;
    const base = {
      bookingId: booking.id,
      guestName: booking.guestName,
      reference: booking.reference,
      checkIn: booking.checkIn,
    };
    if (booking.status !== "CONFIRMED") {
      lines.push({
        ...base,
        kind: "excluded",
        reason: "Đặt phòng không còn xác nhận.",
        retainedIdentityId: null,
        retainedName: null,
      });
      continue;
    }
    if (!(booking.confirmedAt < input.effectiveAt)) {
      lines.push({
        ...base,
        kind: "excluded",
        reason: "Xác nhận sau khi chuyển giao có hiệu lực.",
        retainedIdentityId: null,
        retainedName: null,
      });
      continue;
    }
    const stay = stayFor(booking, input.stays);
    if (!stay || stay.villaId !== input.unitId) {
      lines.push({
        ...base,
        kind: "excluded",
        reason: "Không có kỳ ở để nhận phòng.",
        retainedIdentityId: null,
        retainedName: null,
      });
      continue;
    }
    if (stay.checkedInAt || PAST_CHECK_IN.has(stay.status)) {
      lines.push({
        ...base,
        kind: "excluded",
        reason: "Đã nhận phòng hoặc đã xong — không thuộc nhóm chuyển này.",
        retainedIdentityId: null,
        retainedName: null,
      });
      continue;
    }
    if (stay.status === "CANCELLED" || stay.status === "DID_NOT_OCCUR") {
      lines.push({
        ...base,
        kind: "excluded",
        reason: "Kỳ ở không còn bắt đầu sau chuyển giao.",
        retainedIdentityId: null,
        retainedName: null,
      });
      continue;
    }
    const held = retainedById.get(booking.id);
    if (held) {
      const name = retainedName(held);
      lines.push({
        ...base,
        kind: "retained-locked",
        reason: `Đã giữ cho ${name}. Lần chuyển này không đổi được.`,
        retainedIdentityId: held.retainedIdentityId,
        retainedName: name,
      });
      continue;
    }
    lines.push({
      ...base,
      kind: "attributable",
      reason: "Trong nhóm lần chuyển này.",
      retainedIdentityId: null,
      retainedName: null,
    });
  }
  return lines.sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.bookingId.localeCompare(b.bookingId));
}

/**
 * Who the manual process should pay for one stay at its actual check-in.
 * A RETAIN row wins. Otherwise the Primary effective at that instant.
 * This does not write a row and does not lock the incoming person.
 *
 * PROTOTYPE ASSUMPTION: if neither a RETAIN row nor a Primary relationship
 * covers that instant, the recipient is unresolved. The ADR does not say
 * what the manual process does in that gap.
 */
export function resolvePayoutRecipient(input: {
  retainedIdentityId: string | null;
  primaryAtCheckIn: string | null;
}): { identityId: string | null; source: "retain-override" | "primary-at-check-in" | "unresolved" } {
  if (input.retainedIdentityId) {
    return { identityId: input.retainedIdentityId, source: "retain-override" };
  }
  if (input.primaryAtCheckIn) {
    return { identityId: input.primaryAtCheckIn, source: "primary-at-check-in" };
  }
  return { identityId: null, source: "unresolved" };
}

export function isPayoutChoice(value: string): value is PayoutChoice {
  return value === PAYOUT_RETAIN || value === PAYOUT_FOLLOW_INCOMING;
}

/**
 * PROTOTYPE ASSUMPTION: booking.confirmedAt is the simulated world clock.
 * Seed advances that clock past the database clock. The relationship's
 * valid_from stays on the database clock, as H-1 wrote it. The cohort
 * comparison uses the later of the two clocks, plus 1ms, so a confirmation
 * stamped at the current world instant is still before this transfer. It is
 * not a midnight or timezone snapshot. A confirmation after the world clock
 * moves again is after the transfer.
 */
export function cohortEffectiveAt(input: { worldNow: string; databaseNow: string }): string {
  const world = Date.parse(input.worldNow);
  const database = Date.parse(input.databaseNow);
  const base = Math.max(Number.isFinite(world) ? world : 0, Number.isFinite(database) ? database : 0);
  return new Date(base + 1).toISOString();
}

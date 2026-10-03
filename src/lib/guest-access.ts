import type {
  Booking,
  Commitment,
  PaymentAttempt,
  PaymentObligation,
  ProtectiveHold,
  Stay,
  StayRequest,
  World,
} from "./domain/types.ts";
import { DomainError } from "./domain/types.ts";
import { GUEST_POST_STAY_READ_MS } from "./domain/config.ts";

/**
 * PROTOTYPE ASSUMPTION — not canonical policy.
 * ADR-P077 / SRC-36 require a name and email or phone, and require a Guest
 * Credential distinct from the resource id. The spec leaves the concrete
 * mechanism unresolved (no OTP, password, magic link, or QR is selected).
 * This prototype uses one opaque bearer, stored only as a hash, scoped to the
 * commercial request and the booking/stay that come from it.
 * Recovery, expiry, revocation, retention, and field-level disclosure are not
 * decided here and are not implemented.
 */

export const GUEST_NAME_FALLBACK = "Khách";

export type GuestContact = {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
};

/** Authoritative contact check. Blank and the display fallback are not identity. */
export function normalizeGuestContact(input: {
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
}): GuestContact {
  const guestName = input.guestName?.trim() ?? "";
  const guestEmail = input.guestEmail?.trim() || undefined;
  const guestPhone = input.guestPhone?.trim() || undefined;
  if (!guestName || guestName === GUEST_NAME_FALLBACK) {
    throw new DomainError("INVALID", "Cần tên khách. “Khách” không thay cho tên.");
  }
  if (!guestEmail && !guestPhone) {
    throw new DomainError("INVALID", "Cần email hoặc số điện thoại.");
  }
  return { guestName, guestEmail, guestPhone };
}

export type GuestSlice = {
  request: StayRequest;
  booking: Booking | null;
  stay: Stay | null;
  obligations: PaymentObligation[];
  attempts: PaymentAttempt[];
};

/**
 * Accountless read of one relationship. `access` is the request id the
 * credential resolved to. Contact fields are not an input: email or phone
 * cannot open the slice. A request id or stay id without `access` cannot either.
 */
export function openGuestSlice(
  world: World,
  access: { requestId: string } | null,
  query: { requestId?: string | null; stayId?: string | null },
): GuestSlice | null {
  if (!access?.requestId) return null;
  const request = world.requests.find((item) => item.id === access.requestId);
  if (!request) return null;
  const booking = world.bookings.find((item) => item.requestId === request.id) ?? null;
  const stay =
    world.stays.find(
      (item) =>
        item.requestId === request.id ||
        (booking !== null && (item.id === booking.stayId || item.bookingId === booking.id)),
    ) ?? null;
  if (query.requestId && query.requestId !== request.id) return null;
  if (query.stayId && stay?.id !== query.stayId) return null;
  if (!query.requestId && !query.stayId) return null;
  const obligations = world.obligations.filter((item) => item.requestId === request.id);
  const obligationIds = new Set(obligations.map((item) => item.id));
  const attempts = world.attempts.filter((item) => obligationIds.has(item.obligationId));
  return { request, booking, stay, obligations, attempts };
}

const OPERATIONAL = new Set(["HOST", "BUTLER", "ADMIN", "BQL", "SALE"]);

/** Full world only for a role the server already resolved. Guests get the redacted view. */
export function projectWorldForCaller(world: World, role: { persona: string }): World {
  if (OPERATIONAL.has(role.persona)) return world;
  return redactAccountlessWorld(world);
}

/**
 * Public world used by an accountless caller. Inventory dates stay so a villa
 * can be checked. Guest commerce, payment, and operational records do not.
 * A difficult-to-guess id is not copied through.
 */
export function redactAccountlessWorld(world: World): World {
  return {
    ...world,
    requests: [],
    bookings: [],
    stays: [],
    obligations: [],
    attempts: [],
    refundCases: [],
    commissions: [],
    incidents: [],
    checkoutAssessments: [],
    readinessNotes: [],
    conflicts: [],
    auditLog: [],
    externalAccommodations: world.externalAccommodations.map((item) => ({
      ...item,
      guestName: undefined,
    })),
    commitments: world.commitments.map(publicCommitment),
    protectiveHolds: (world.protectiveHolds ?? []).map(publicHold),
  };
}

function publicCommitment(item: Commitment): Commitment {
  return {
    id: item.id,
    villaId: item.villaId,
    start: item.start,
    end: item.end,
    kind: item.kind,
    status: item.status,
    expiresAt: item.expiresAt,
    basis: item.basis,
    blockKind: item.blockKind,
  };
}

function publicHold(item: ProtectiveHold): ProtectiveHold {
  return {
    id: item.id,
    villaId: item.villaId,
    start: item.start,
    end: item.end,
    status: item.status,
    note: "",
    createdAt: item.createdAt,
    createdBy: item.createdBy,
    reviewDueAt: item.reviewDueAt,
    endedAt: item.endedAt,
    endedAs: item.endedAs,
  };
}

export type GuestStayAccess = "live" | "read-only" | "ended";

/**
 * Oceanami V0 prototype window. A completed Stay is read-only until
 * completedAt + 30 days, then the view is denied. Not a security system.
 */
export function guestStayAccess(
  stay: { status: string; completedAt?: string } | null | undefined,
  now: string,
): GuestStayAccess {
  if (!stay || stay.status !== "COMPLETED" || !stay.completedAt) return "live";
  if (Date.parse(now) - Date.parse(stay.completedAt) >= GUEST_POST_STAY_READ_MS) return "ended";
  return "read-only";
}

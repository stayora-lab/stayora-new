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
import { villasForHost } from "./villas.ts";

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

/**
 * Butler, BQL and Admin stay on the full operational world.
 * Canonical copy says they are need-to-know (Butler is not commercial; BQL
 * does not get the commercial ledger; Admin is exception-scoped) but
 * 22-privacy-need-to-know says those categories are not field-level rules.
 * Field visibility is still TBD, so this prototype does not invent a cut.
 * SALE and HOST are relationship-scoped below. That is the wire boundary
 * the workspaces were already filtering in the UI.
 */
const FULL_OPERATIONAL = new Set(["BUTLER", "ADMIN", "BQL"]);

export type WorldCaller = {
  persona: string;
  saleId?: string;
  hostId?: string;
  /** HOST and COHOST grant scope refs. Catalogue host ids are not in this list. */
  villaIds?: readonly string[];
};

/** Projects the world the caller is allowed to hold. Guests stay accountless. */
export function projectWorldForCaller(world: World, role: WorldCaller): World {
  if (role.persona === "SALE") return projectWorldForSale(world, role.saleId);
  if (role.persona === "HOST") return projectWorldForHost(world, villaIdsForHost(role));
  if (FULL_OPERATIONAL.has(role.persona)) return world;
  return redactAccountlessWorld(world);
}

/**
 * Catalogue Primary ids (host-an, …) plus villa ids from HOST and COHOST grants.
 * Co-host is a grant, not a second hosting_relationships kind.
 */
function villaIdsForHost(role: { hostId?: string; villaIds?: readonly string[] }): Set<string> {
  const ids = new Set<string>();
  for (const id of role.villaIds ?? []) {
    if (id) ids.add(id);
  }
  for (const villa of villasForHost(role.hostId)) ids.add(villa.id);
  return ids;
}

function projectWorldForSale(world: World, saleId: string | undefined): World {
  const requests = saleId ? world.requests.filter((item) => item.saleId === saleId) : [];
  const requestIds = new Set(requests.map((item) => item.id));
  const bookings = saleId ? world.bookings.filter((item) => item.saleId === saleId) : [];
  const stays = staysForSale(world, requestIds, bookings);
  return {
    ...world,
    requests,
    bookings,
    stays,
    commissions: saleId ? world.commissions.filter((item) => item.saleId === saleId) : [],
    ...moneyForRequests(world, requestIds),
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

function staysForSale(world: World, requestIds: Set<string>, bookings: Booking[]): Stay[] {
  const bookingIds = new Set(bookings.map((item) => item.id));
  const stayIds = new Set(bookings.map((item) => item.stayId));
  return world.stays.filter(
    (stay) =>
      (stay.requestId !== undefined && requestIds.has(stay.requestId)) ||
      (stay.bookingId !== undefined && bookingIds.has(stay.bookingId)) ||
      stayIds.has(stay.id),
  );
}

function projectWorldForHost(world: World, villaIds: Set<string>): World {
  const requests = world.requests.filter((item) => villaIds.has(item.villaId));
  const requestIds = new Set(requests.map((item) => item.id));
  const bookings = world.bookings.filter((item) => villaIds.has(item.villaId));
  const bookingIds = new Set(bookings.map((item) => item.id));
  const stays = world.stays.filter((item) => villaIds.has(item.villaId));
  const stayIds = new Set(stays.map((item) => item.id));
  const commitments = world.commitments.filter((item) => villaIds.has(item.villaId));
  const incidents = world.incidents.filter((item) => villaIds.has(item.villaId));
  const protectiveHolds = (world.protectiveHolds ?? []).filter((item) => villaIds.has(item.villaId));
  const externalAccommodations = world.externalAccommodations.filter((item) =>
    villaIds.has(item.villaId),
  );
  const conflicts = world.conflicts.filter((item) => villaIds.has(item.villaId));
  const commissions = world.commissions.filter(
    (item) => bookingIds.has(item.bookingId) || stayIds.has(item.stayId),
  );
  const money = moneyForRequests(world, requestIds);
  const objectIds = new Set<string>(villaIds);
  for (const item of [
    ...requests,
    ...bookings,
    ...stays,
    ...commitments,
    ...incidents,
    ...protectiveHolds,
    ...externalAccommodations,
    ...conflicts,
    ...commissions,
    ...money.obligations,
    ...money.attempts,
    ...money.refundCases,
  ]) {
    objectIds.add(item.id);
  }
  return {
    ...world,
    requests,
    bookings,
    stays,
    commitments,
    incidents,
    checkoutAssessments: world.checkoutAssessments?.filter((item) => villaIds.has(item.villaId)),
    readinessNotes: world.readinessNotes?.filter((item) => villaIds.has(item.villaId)),
    commissions,
    ...money,
    conflicts,
    protectiveHolds,
    villaReadiness: world.villaReadiness?.filter((item) => villaIds.has(item.villaId)),
    auditLog: world.auditLog.filter((item) => objectIds.has(item.objectId)),
    externalAccommodations,
  };
}

function moneyForRequests(
  world: World,
  requestIds: Set<string>,
): Pick<World, "obligations" | "attempts" | "refundCases"> {
  const obligations = world.obligations.filter((item) => requestIds.has(item.requestId));
  const obligationIds = new Set(obligations.map((item) => item.id));
  return {
    obligations,
    attempts: world.attempts.filter((item) => obligationIds.has(item.obligationId)),
    refundCases: world.refundCases.filter((item) => requestIds.has(item.requestId)),
  };
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

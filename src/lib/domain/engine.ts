import { parseISO } from "date-fns";
import {
  activeCommitments,
  isAvailable,
  isHoldActive,
  openConflictsCovering,
  rangesOverlap,
} from "./availability.ts";
import {
  BUTLER_LINH,
  nightsBetween,
  paymentPlan,
  requireVilla,
  SALE_MAI,
} from "./catalog.ts";
import { COMMISSION_RATE, HOLD_MS } from "./config.ts";
import type {
  Actor,
  AuditEntry,
  Booking,
  Commission,
  Commitment,
  ExternalAccommodation,
  ExternalSource,
  InventoryConflict,
  PaymentAttempt,
  PaymentObligation,
  PaymentOutcome,
  RefundCase,
  RefundReason,
  Stay,
  StayRequest,
  World,
} from "./types.ts";
import { DomainError } from "./types.ts";

export { DomainError, isAvailable, isHoldActive };
export type { World };

function nid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function reference(prefix = "STY"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 4; i += 1) token += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${token}`;
}

function requireRequest(world: World, requestId: string): StayRequest {
  const request = world.requests.find((item) => item.id === requestId);
  if (!request) throw new DomainError("NOT_FOUND", "Request not found");
  return request;
}

function requireStay(world: World, stayId: string): Stay {
  const stay = world.stays.find((item) => item.id === stayId);
  if (!stay) throw new DomainError("NOT_FOUND", "Stay not found");
  return stay;
}

function requireObligation(world: World, obligationId: string): PaymentObligation {
  const obligation = world.obligations.find((item) => item.id === obligationId);
  if (!obligation) throw new DomainError("NOT_FOUND", "Obligation not found");
  return obligation;
}

function requireCommitment(world: World, commitmentId: string): Commitment {
  const commitment = world.commitments.find((item) => item.id === commitmentId);
  if (!commitment) throw new DomainError("NOT_FOUND", "Commitment not found");
  return commitment;
}

function assertHost(actor: Actor): void {
  if (actor.persona !== "HOST") {
    throw new DomainError("FORBIDDEN", "Only Host can do this");
  }
}

function assertAdmin(actor: Actor): void {
  if (actor.persona !== "ADMIN") {
    throw new DomainError("FORBIDDEN", "Only Stayora vận hành can record payment");
  }
}

function assertButlerAssigned(world: World, actor: Actor, villaId: string): void {
  if (actor.persona !== "BUTLER") {
    throw new DomainError("FORBIDDEN", "Only a Butler can change a Stay");
  }
  const butler = world.butlers.find((person) => person.id === actor.butlerId);
  if (!butler?.villaIds?.includes(villaId)) {
    throw new DomainError("NOT_ASSIGNED", "This villa is not assigned to this Butler");
  }
}

function replaceRequest(world: World, request: StayRequest): World {
  return {
    ...world,
    requests: world.requests.map((item) => (item.id === request.id ? request : item)),
  };
}

function replaceStay(world: World, stay: Stay): World {
  return {
    ...world,
    stays: world.stays.map((item) => (item.id === stay.id ? stay : item)),
  };
}

function withAudit(
  world: World,
  actor: Actor,
  action: string,
  objectId: string,
  reason?: string,
): World {
  const entry: AuditEntry = {
    id: nid("aud"),
    at: world.now,
    persona: actor.persona,
    action,
    objectId,
    reason,
  };
  return { ...world, auditLog: [entry, ...(world.auditLog ?? [])] };
}

function hasUnresolvedUnknown(world: World, obligationId: string): boolean {
  return world.attempts.some(
    (attempt) => attempt.obligationId === obligationId && attempt.status === "UNKNOWN",
  );
}

function activeHoldFor(world: World, requestId: string): Commitment | undefined {
  return world.commitments.find(
    (commitment) =>
      commitment.kind === "HOLD" &&
      commitment.requestId === requestId &&
      isHoldActive(commitment, world.now),
  );
}

function makeRefund(
  world: World,
  input: {
    requestId: string;
    attemptId?: string;
    amount: number;
    reason: RefundReason;
  },
): { world: World; refund: RefundCase } {
  const refund: RefundCase = {
    id: nid("ref"),
    requestId: input.requestId,
    attemptId: input.attemptId,
    amount: input.amount,
    reason: input.reason,
    status: "OPEN",
    createdAt: world.now,
  };
  return {
    world: { ...world, refundCases: [refund, ...(world.refundCases ?? [])] },
    refund,
  };
}

export function expireHolds(world: World): World {
  let changed = false;
  const commitments = world.commitments.map((commitment) => {
    if (
      commitment.kind === "HOLD" &&
      commitment.status === "ACTIVE" &&
      commitment.expiresAt &&
      commitment.expiresAt <= world.now
    ) {
      changed = true;
      return { ...commitment, status: "ENDED" as const, endedReason: "EXPIRED" as const };
    }
    return commitment;
  });
  const expiredHoldRequestIds = new Set(
    commitments
      .filter(
        (commitment) =>
          commitment.kind === "HOLD" &&
          commitment.status === "ENDED" &&
          commitment.endedReason === "EXPIRED" &&
          commitment.requestId,
      )
      .map((commitment) => commitment.requestId as string),
  );
  const bookedRequestIds = new Set(
    world.bookings
      .filter((booking) => booking.status === "CONFIRMED")
      .map((booking) => booking.requestId),
  );
  const requests = world.requests.map((request) => {
    if (
      request.status === "ACCEPTED" &&
      expiredHoldRequestIds.has(request.id) &&
      !bookedRequestIds.has(request.id)
    ) {
      changed = true;
      return { ...request, status: "EXPIRED" as const, expiredAt: world.now };
    }
    return request;
  });
  if (!changed) return world;
  return { ...world, commitments, requests };
}

export function advanceTime(world: World, ms: number): World {
  const now = new Date(parseISO(world.now).getTime() + ms).toISOString();
  return expireHolds({ ...world, now });
}

export function createEmptyWorld(now: string): World {
  return {
    now,
    requests: [],
    bookings: [],
    stays: [],
    commitments: [],
    incidents: [],
    commissions: [],
    obligations: [],
    attempts: [],
    refundCases: [],
    conflicts: [],
    auditLog: [],
    externalAccommodations: [],
    sales: [{ id: SALE_MAI, name: "Chủ nhà An" }],
    butlers: [
      { id: BUTLER_LINH, name: "Quản gia Chi", villaIds: ["t01", "t02", "t03", "t04", "t05", "t06"] },
    ],
  };
}

export function createRequest(
  world: World,
  input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestName: string;
    actor: Actor;
    id?: string;
  },
): { world: World; request: StayRequest } {
  world = expireHolds(world);
  if (input.actor.persona !== "GUEST" && input.actor.persona !== "SALE") {
    throw new DomainError("FORBIDDEN", "Only Guest or Sale can create a request");
  }
  const villa = requireVilla(input.villaId);
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < 1) throw new DomainError("INVALID", "Check-out must be after check-in");
  if (input.guests > villa.sleeps) {
    throw new DomainError("TOO_MANY_GUESTS", `Sleeps up to ${villa.sleeps}`);
  }
  if (!isAvailable(world, input.villaId, input.checkIn, input.checkOut)) {
    throw new DomainError("NOT_AVAILABLE", "Not available for these dates");
  }
  const source = input.actor.persona === "SALE" ? "SALE" : "GUEST";
  const saleId = input.actor.persona === "SALE" ? input.actor.saleId : undefined;
  const request: StayRequest = {
    id: input.id ?? nid("req"),
    villaId: input.villaId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName.trim() || "Khách",
    nightly: villa.nightly,
    nights,
    total: villa.nightly * nights,
    source,
    saleId,
    status: "PENDING",
    createdAt: world.now,
  };
  return {
    world: withAudit(
      { ...world, requests: [request, ...world.requests] },
      input.actor,
      "CREATE_REQUEST",
      request.id,
    ),
    request,
  };
}

export function acceptRequest(
  world: World,
  input: { requestId: string; actor: Actor },
): { world: World; request: StayRequest } {
  world = expireHolds(world);
  assertHost(input.actor);
  const current = requireRequest(world, input.requestId);
  if (current.status !== "PENDING") {
    throw new DomainError("INVALID_TRANSITION", "Only a pending request can be accepted");
  }
  if (!isAvailable(world, current.villaId, current.checkIn, current.checkOut)) {
    const request: StayRequest = {
      ...current,
      status: "CONFLICTED",
      conflictedAt: world.now,
    };
    return {
      world: withAudit(replaceRequest(world, request), input.actor, "ACCEPT_REQUEST", request.id),
      request,
    };
  }
  const holdExpiresAt = new Date(parseISO(world.now).getTime() + HOLD_MS).toISOString();
  const request: StayRequest = {
    ...current,
    status: "ACCEPTED",
    acceptedAt: world.now,
    holdExpiresAt,
  };
  const hold: Commitment = {
    id: nid("hold"),
    villaId: request.villaId,
    start: request.checkIn,
    end: request.checkOut,
    kind: "HOLD",
    status: "ACTIVE",
    expiresAt: holdExpiresAt,
    basis: "STAYORA_BOOKING",
    requestId: request.id,
    createdBy: "HOST",
    createdAt: world.now,
  };
  const obligations: PaymentObligation[] = [
    ...world.obligations,
    ...paymentPlan(request.total, request.checkIn, request.createdAt).map((line) => ({
      id: nid("obl"),
      requestId: request.id,
      kind: line.kind,
      amount: line.amount,
      dueAt: line.dueAt,
    })),
  ];
  return {
    world: withAudit(
      {
        ...replaceRequest(world, request),
        commitments: [...world.commitments, hold],
        obligations,
      },
      input.actor,
      "ACCEPT_REQUEST",
      request.id,
    ),
    request,
  };
}

export function rejectRequest(
  world: World,
  input: { requestId: string; actor: Actor },
): { world: World; request: StayRequest } {
  world = expireHolds(world);
  assertHost(input.actor);
  const current = requireRequest(world, input.requestId);
  if (current.status === "ACCEPTED") {
    throw new DomainError("INVALID_TRANSITION", "Cannot reject an accepted request");
  }
  if (current.status !== "PENDING") {
    throw new DomainError("INVALID_TRANSITION", "Only a pending request can be rejected");
  }
  const request: StayRequest = {
    ...current,
    status: "DECLINED",
    declinedAt: world.now,
  };
  return {
    world: withAudit(replaceRequest(world, request), input.actor, "REJECT_REQUEST", request.id),
    request,
  };
}

function fulfillInitialSuccess(
  world: World,
  obligation: PaymentObligation,
  hold: Commitment,
  actor: Actor,
): { world: World; booking: Booking; stay: Stay } {
  const request = requireRequest(world, obligation.requestId);
  const bookingId = nid("bkg");
  const stayId = nid("sty");
  const ref = reference();
  const booking: Booking = {
    id: bookingId,
    requestId: request.id,
    stayId,
    villaId: request.villaId,
    reference: ref,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    guests: request.guests,
    guestName: request.guestName,
    nightly: request.nightly,
    nights: request.nights,
    total: request.total,
    saleId: request.saleId,
    status: "CONFIRMED",
    confirmedAt: world.now,
  };
  const butler = world.butlers.find((person) => person.villaIds?.includes(request.villaId));
  const stay: Stay = {
    id: stayId,
    bookingId,
    requestId: request.id,
    villaId: request.villaId,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    guests: request.guests,
    guestName: request.guestName,
    origin: "STAYORA",
    originLabel: "Stayora",
    status: "SCHEDULED",
    assignedButlerId: butler?.id,
  };
  const confirmed: Commitment = {
    id: nid("cmt"),
    villaId: request.villaId,
    start: request.checkIn,
    end: request.checkOut,
    kind: "CONFIRMED_ACCOMMODATION",
    status: "ACTIVE",
    basis: "STAYORA_BOOKING",
    requestId: request.id,
    bookingId,
    stayId,
    reference: ref,
    createdBy: actor.persona,
    createdAt: world.now,
  };
  const commissions: Commission[] = [...world.commissions];
  if (request.saleId) {
    commissions.push({
      id: nid("com"),
      bookingId,
      stayId,
      saleId: request.saleId,
      amount: Math.round(request.total * COMMISSION_RATE),
      status: "PENDING",
    });
  }
  return {
    world: {
      ...world,
      bookings: [booking, ...world.bookings],
      stays: [stay, ...world.stays],
      commitments: [
        ...world.commitments.map((item) =>
          item.id === hold.id
            ? { ...item, status: "ENDED" as const, endedReason: "SUPERSEDED" as const }
            : item,
        ),
        confirmed,
      ],
      commissions,
    },
    booking,
    stay,
  };
}

function applyInitialSuccess(
  world: World,
  obligation: PaymentObligation,
  attempt: PaymentAttempt,
  actor: Actor,
): { world: World; booking?: Booking; stay?: Stay; refund?: RefundCase } {
  if (obligation.kind !== "INITIAL") return { world };
  if (world.bookings.some((booking) => booking.requestId === obligation.requestId && booking.status === "CONFIRMED")) {
    return { world };
  }
  const request = requireRequest(world, obligation.requestId);
  if (openConflictsCovering(world, request.villaId, request.checkIn, request.checkOut).length > 0) {
    return makeRefund(world, {
      requestId: request.id,
      attemptId: attempt.id,
      amount: obligation.amount,
      reason: "INVENTORY_CONFLICT",
    });
  }
  const hold = activeHoldFor(world, obligation.requestId);
  if (!hold) {
    const endedHold = world.commitments.find(
      (item) => item.kind === "HOLD" && item.requestId === request.id,
    );
    const byConflict =
      request.status === "CONFLICTED" || endedHold?.endedReason === "RELEASED";
    return makeRefund(world, {
      requestId: request.id,
      attemptId: attempt.id,
      amount: obligation.amount,
      reason: byConflict ? "INVENTORY_CONFLICT" : "HOLD_EXPIRED",
    });
  }
  return fulfillInitialSuccess(world, obligation, hold, actor);
}

type PaymentResult = {
  world: World;
  attempt: PaymentAttempt;
  booking?: Booking;
  stay?: Stay;
  refund?: RefundCase;
};

function finishPayment(
  world: World,
  actor: Actor,
  action: string,
  attempt: PaymentAttempt,
  extra: { booking?: Booking; stay?: Stay; refund?: RefundCase } = {},
): PaymentResult {
  return {
    world: withAudit(world, actor, action, extra.refund?.id ?? extra.booking?.id ?? attempt.id),
    attempt,
    booking: extra.booking,
    stay: extra.stay,
    refund: extra.refund,
  };
}

export function recordPayment(
  world: World,
  input: { obligationId: string; outcome: PaymentOutcome; actor: Actor },
): PaymentResult {
  world = expireHolds(world);
  assertAdmin(input.actor);
  const obligation = requireObligation(world, input.obligationId);
  if (obligation.kind === "BALANCE" && !bookingForRequest(world, obligation.requestId)) {
    throw new DomainError("NO_BOOKING_YET", "Balance cannot be recorded before a Booking exists");
  }
  if (hasUnresolvedUnknown(world, obligation.id)) {
    throw new DomainError("ATTEMPT_UNRESOLVED", "An unknown attempt must be resolved first");
  }
  const alreadyPaid = obligationSucceeded(world, obligation.id);
  const attempt: PaymentAttempt = {
    id: nid("att"),
    obligationId: obligation.id,
    status: input.outcome,
    at: world.now,
  };
  world = { ...world, attempts: [attempt, ...world.attempts] };

  if (input.outcome === "SUCCEEDED" && alreadyPaid) {
    const refunded = makeRefund(world, {
      requestId: obligation.requestId,
      attemptId: attempt.id,
      amount: obligation.amount,
      reason: "DUPLICATE_PAYMENT",
    });
    return finishPayment(refunded.world, input.actor, "RECORD_PAYMENT", attempt, {
      refund: refunded.refund,
    });
  }

  if (input.outcome === "SUCCEEDED") {
    const cancelled = refundCancelledBalance(world, obligation, attempt);
    if (cancelled) {
      return finishPayment(cancelled.world, input.actor, "RECORD_PAYMENT", attempt, {
        refund: cancelled.refund,
      });
    }
  }

  if (input.outcome !== "SUCCEEDED" || obligation.kind !== "INITIAL") {
    return finishPayment(world, input.actor, "RECORD_PAYMENT", attempt);
  }

  const applied = applyInitialSuccess(world, obligation, attempt, input.actor);
  return finishPayment(applied.world, input.actor, "RECORD_PAYMENT", attempt, applied);
}

export function resolveUnknown(
  world: World,
  input: { attemptId: string; outcome: "SUCCEEDED" | "FAILED"; actor: Actor },
): PaymentResult {
  world = expireHolds(world);
  assertAdmin(input.actor);
  const current = world.attempts.find((item) => item.id === input.attemptId);
  if (!current) throw new DomainError("NOT_FOUND", "Attempt not found");
  if (current.status !== "UNKNOWN") {
    throw new DomainError("INVALID_TRANSITION", "Only an unknown attempt can be resolved");
  }
  const obligation = requireObligation(world, current.obligationId);
  const alreadyPaid = obligationSucceeded(world, obligation.id);
  const attempt: PaymentAttempt = { ...current, status: input.outcome, at: world.now };
  world = {
    ...world,
    attempts: world.attempts.map((item) => (item.id === attempt.id ? attempt : item)),
  };
  if (input.outcome !== "SUCCEEDED") {
    return finishPayment(world, input.actor, "RESOLVE_UNKNOWN", attempt);
  }
  if (alreadyPaid) {
    const refunded = makeRefund(world, {
      requestId: obligation.requestId,
      attemptId: attempt.id,
      amount: obligation.amount,
      reason: "DUPLICATE_PAYMENT",
    });
    return finishPayment(refunded.world, input.actor, "RESOLVE_UNKNOWN", attempt, {
      refund: refunded.refund,
    });
  }
  const cancelled = refundCancelledBalance(world, obligation, attempt);
  if (cancelled) {
    return finishPayment(cancelled.world, input.actor, "RESOLVE_UNKNOWN", attempt, {
      refund: cancelled.refund,
    });
  }
  const applied = applyInitialSuccess(world, obligation, attempt, input.actor);
  return finishPayment(applied.world, input.actor, "RESOLVE_UNKNOWN", attempt, applied);
}

export function checkInStay(
  world: World,
  input: { stayId: string; actor: Actor },
): { world: World; stay: Stay } {
  world = expireHolds(world);
  const stay = requireStay(world, input.stayId);
  assertButlerAssigned(world, input.actor, stay.villaId);
  if (stay.status === "CANCELLED") {
    throw new DomainError("INVALID_TRANSITION", "A cancelled stay cannot be checked in");
  }
  if (stay.status !== "SCHEDULED") {
    throw new DomainError("INVALID_TRANSITION", "Check-in is only possible from scheduled");
  }
  const updated: Stay = { ...stay, status: "CHECKED_IN", checkedInAt: world.now };
  return {
    world: withAudit(replaceStay(world, updated), input.actor, "CHECK_IN", updated.id),
    stay: updated,
  };
}

export function checkOutStay(
  world: World,
  input: { stayId: string; actor: Actor },
): { world: World; stay: Stay } {
  world = expireHolds(world);
  const stay = requireStay(world, input.stayId);
  assertButlerAssigned(world, input.actor, stay.villaId);
  if (stay.status === "CANCELLED") {
    throw new DomainError("INVALID_TRANSITION", "A cancelled stay cannot be checked out");
  }
  if (stay.status !== "CHECKED_IN") {
    throw new DomainError("INVALID_TRANSITION", "Check-out is only possible after check-in");
  }
  const completed: Stay = {
    ...stay,
    status: "COMPLETED",
    checkedOutAt: world.now,
    completedAt: world.now,
  };
  const commissions = world.commissions.map((item) =>
    item.stayId === stay.id && item.status !== "VOID"
      ? { ...item, status: "EARNED" as const }
      : item,
  );
  return {
    world: withAudit(
      { ...replaceStay(world, completed), commissions },
      input.actor,
      "CHECK_OUT",
      completed.id,
    ),
    stay: completed,
  };
}

export function markDidNotOccur(
  world: World,
  input: { stayId: string; actor: Actor; reason: string },
): { world: World; stay: Stay } {
  world = expireHolds(world);
  const stay = requireStay(world, input.stayId);
  assertButlerAssigned(world, input.actor, stay.villaId);
  if (stay.status === "CHECKED_IN") {
    throw new DomainError("INVALID_TRANSITION", "DID_NOT_OCCUR is refused after check-in");
  }
  if (stay.status === "CANCELLED") {
    throw new DomainError("INVALID_TRANSITION", "A cancelled stay cannot be marked did-not-occur");
  }
  if (stay.status !== "SCHEDULED") {
    throw new DomainError("INVALID_TRANSITION", "No-show is only possible from scheduled");
  }
  if (!input.reason.trim()) {
    throw new DomainError("MISSING_REASON", "A reason is required");
  }
  const updated: Stay = {
    ...stay,
    status: "DID_NOT_OCCUR",
    didNotOccurReason: input.reason.trim(),
    didNotOccurAt: world.now,
  };
  return {
    world: withAudit(
      replaceStay(world, updated),
      input.actor,
      "DID_NOT_OCCUR",
      updated.id,
      input.reason.trim(),
    ),
    stay: updated,
  };
}

export function reportIncident(
  world: World,
  input: { stayId: string; actor: Actor; note: string; hasPhoto: boolean },
): { world: World } {
  world = expireHolds(world);
  if (input.actor.persona !== "BUTLER") {
    throw new DomainError("FORBIDDEN", "Only a Butler can report an incident");
  }
  const stay = requireStay(world, input.stayId);
  assertButlerAssigned(world, input.actor, stay.villaId);
  const incident = {
    id: nid("inc"),
    stayId: stay.id,
    villaId: stay.villaId,
    note: input.note.trim(),
    hasPhoto: input.hasPhoto,
    createdAt: world.now,
    createdBy: "BUTLER" as const,
  };
  return {
    world: withAudit(
      { ...world, incidents: [incident, ...world.incidents] },
      input.actor,
      "REPORT_INCIDENT",
      incident.id,
    ),
  };
}

export function recordExternalBooking(
  world: World,
  input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    source: ExternalSource;
    guestName?: string;
    actor: Actor;
  },
): { world: World; stay: Stay; commitment: Commitment; conflict?: InventoryConflict } {
  world = expireHolds(world);
  assertHost(input.actor);
  requireVilla(input.villaId);
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights < 1) throw new DomainError("INVALID", "Check-out must be after check-in");
  const overlapping = activeCommitments(world).filter(
    (commitment) =>
      commitment.villaId === input.villaId &&
      rangesOverlap(input.checkIn, input.checkOut, commitment.start, commitment.end),
  );
  const external: ExternalAccommodation = {
    id: nid("ext"),
    villaId: input.villaId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName?.trim() || undefined,
    source: input.source,
  };
  const stayId = nid("sty");
  const commitmentId = nid("cmt");
  const ref = reference("EXT");
  const butler = world.butlers.find((person) => person.villaIds?.includes(input.villaId));
  const stay: Stay = {
    id: stayId,
    villaId: input.villaId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName?.trim() || "Khách",
    origin: "EXTERNAL",
    originLabel: input.source,
    status: "SCHEDULED",
    assignedButlerId: butler?.id,
  };
  const commitment: Commitment = {
    id: commitmentId,
    villaId: input.villaId,
    start: input.checkIn,
    end: input.checkOut,
    kind: "CONFIRMED_ACCOMMODATION",
    status: "ACTIVE",
    basis: "EXTERNAL",
    stayId,
    externalId: external.id,
    source: input.source,
    reference: ref,
    createdBy: "HOST",
    createdAt: world.now,
  };
  let conflicts = world.conflicts ?? [];
  let conflict: InventoryConflict | undefined;
  if (overlapping.length > 0) {
    conflict = {
      id: nid("cnf"),
      villaId: input.villaId,
      commitmentIds: [...overlapping.map((item) => item.id), commitmentId],
      status: "OPEN",
      createdAt: world.now,
    };
    conflicts = [conflict, ...conflicts];
  }
  return {
    world: withAudit(
      {
        ...world,
        externalAccommodations: [external, ...world.externalAccommodations],
        stays: [stay, ...world.stays],
        commitments: [...world.commitments, commitment],
        conflicts,
      },
      input.actor,
      "RECORD_EXTERNAL",
      stay.id,
    ),
    stay,
    commitment,
    conflict,
  };
}

export function createBlock(
  world: World,
  input: {
    villaId: string;
    start: string;
    end: string;
    blockKind: "OWNER" | "MAINTENANCE";
    note?: string;
    actor: Actor;
  },
): { world: World; commitment: Commitment } {
  world = expireHolds(world);
  assertHost(input.actor);
  requireVilla(input.villaId);
  if (nightsBetween(input.start, input.end) < 1) {
    throw new DomainError("INVALID", "End must be after start");
  }
  if (!isAvailable(world, input.villaId, input.start, input.end)) {
    throw new DomainError("NOT_AVAILABLE", "Not available for these dates");
  }
  const commitment: Commitment = {
    id: nid("blk"),
    villaId: input.villaId,
    start: input.start,
    end: input.end,
    kind: "AVAILABILITY_BLOCK",
    status: "ACTIVE",
    basis: "BLOCK",
    blockKind: input.blockKind,
    note: input.note?.trim() || undefined,
    createdBy: "HOST",
    createdAt: world.now,
  };
  return {
    world: withAudit(
      { ...world, commitments: [...world.commitments, commitment] },
      input.actor,
      "CREATE_BLOCK",
      commitment.id,
    ),
    commitment,
  };
}

export function releaseBlock(
  world: World,
  input: { commitmentId: string; actor: Actor },
): { world: World; commitment: Commitment } {
  world = expireHolds(world);
  assertHost(input.actor);
  const current = requireCommitment(world, input.commitmentId);
  if (current.kind !== "AVAILABILITY_BLOCK") {
    throw new DomainError("INVALID_TRANSITION", "Only an availability block can be released");
  }
  if (current.status !== "ACTIVE") {
    throw new DomainError("INVALID_TRANSITION", "Block is already ended");
  }
  const commitment: Commitment = {
    ...current,
    status: "ENDED",
    endedReason: "RELEASED",
  };
  return {
    world: withAudit(
      {
        ...world,
        commitments: world.commitments.map((item) =>
          item.id === commitment.id ? commitment : item,
        ),
      },
      input.actor,
      "RELEASE_BLOCK",
      commitment.id,
    ),
    commitment,
  };
}

export function resolveConflict(
  world: World,
  input: {
    conflictId: string;
    keepCommitmentId: string;
    endCommitmentId: string;
    reason: string;
    actor: Actor;
  },
): { world: World; conflict: InventoryConflict; refund?: RefundCase } {
  world = expireHolds(world);
  assertAdmin(input.actor);
  if (!input.reason.trim()) throw new DomainError("MISSING_REASON", "A reason is required");
  const current = (world.conflicts ?? []).find((item) => item.id === input.conflictId);
  if (!current) throw new DomainError("NOT_FOUND", "Conflict not found");
  if (current.status !== "OPEN") {
    throw new DomainError("INVALID_TRANSITION", "Conflict is already resolved");
  }
  if (input.keepCommitmentId === input.endCommitmentId) {
    throw new DomainError("INVALID", "Keep and end must be different commitments");
  }
  if (
    !current.commitmentIds.includes(input.keepCommitmentId) ||
    !current.commitmentIds.includes(input.endCommitmentId)
  ) {
    throw new DomainError("INVALID", "Commitments must belong to the conflict");
  }
  const ending = requireCommitment(world, input.endCommitmentId);
  if (ending.status !== "ACTIVE") {
    throw new DomainError("INVALID_TRANSITION", "Commitment is already ended");
  }
  const relatedStay = stayForCommitment(world, ending);
  if (relatedStay?.status === "CHECKED_IN") {
    throw new DomainError("STAY_IN_PROGRESS", "Cannot end a commitment while the stay is in progress");
  }
  const remaining = current.commitmentIds
    .filter((id) => id !== ending.id)
    .map((id) => world.commitments.find((item) => item.id === id))
    .filter((item): item is Commitment => {
      if (!item || item.status !== "ACTIVE") return false;
      if (item.kind === "HOLD" && !isHoldActive(item, world.now)) return false;
      return true;
    });
  for (let i = 0; i < remaining.length; i += 1) {
    for (let j = i + 1; j < remaining.length; j += 1) {
      if (rangesOverlap(remaining[i]!.start, remaining[i]!.end, remaining[j]!.start, remaining[j]!.end)) {
        throw new DomainError("STILL_OVERLAPPING", "Ending this commitment still leaves an overlap");
      }
    }
  }

  const ended: Commitment = { ...ending, status: "ENDED", endedReason: "RELEASED" };
  let bookings = world.bookings;
  let stays = world.stays;
  let commissions = world.commissions;
  let requests = world.requests;
  let refund: RefundCase | undefined;

  if (ending.kind === "CONFIRMED_ACCOMMODATION" && ending.basis === "STAYORA_BOOKING" && ending.bookingId) {
    const booking = world.bookings.find((item) => item.id === ending.bookingId);
    if (booking && booking.status === "CONFIRMED") {
      const paid = world.obligations
        .filter((item) => item.requestId === booking.requestId)
        .reduce((sum, obligation) => {
          return obligationSucceeded(world, obligation.id) ? sum + obligation.amount : sum;
        }, 0);
      const succeededAttempt = world.attempts.find(
        (item) =>
          item.status === "SUCCEEDED" &&
          world.obligations.some(
            (obligation) =>
              obligation.id === item.obligationId && obligation.requestId === booking.requestId,
          ),
      );
      const refunded = makeRefund(world, {
        requestId: booking.requestId,
        attemptId: succeededAttempt?.id,
        amount: paid || booking.total,
        reason: "CONFLICT_RESOLUTION",
      });
      world = refunded.world;
      refund = refunded.refund;
      bookings = world.bookings.map((item) =>
        item.id === booking.id
          ? { ...item, status: "CANCELLED" as const, cancelledAt: world.now }
          : item,
      );
      stays = world.stays.map((item) =>
        item.id === booking.stayId && item.status === "SCHEDULED"
          ? { ...item, status: "CANCELLED" as const }
          : item,
      );
      commissions = world.commissions.map((item) =>
        item.bookingId === booking.id ? { ...item, status: "VOID" as const } : item,
      );
    }
  }

  if (ending.kind === "CONFIRMED_ACCOMMODATION" && ending.basis === "EXTERNAL") {
    const stayId = ending.stayId;
    stays = stays.map((item) =>
      item.id === stayId && item.status === "SCHEDULED"
        ? { ...item, status: "CANCELLED" as const }
        : item,
    );
  }

  if (ending.kind === "HOLD" && ending.requestId) {
    requests = requests.map((item) =>
      item.id === ending.requestId && item.status === "ACCEPTED"
        ? { ...item, status: "CONFLICTED" as const, conflictedAt: world.now }
        : item,
    );
  }

  const conflict: InventoryConflict = {
    ...current,
    status: "RESOLVED",
    resolvedAt: world.now,
    keepCommitmentId: input.keepCommitmentId,
    endCommitmentId: input.endCommitmentId,
    reason: input.reason.trim(),
  };
  return {
    world: withAudit(
      {
        ...world,
        bookings,
        stays,
        commissions,
        requests,
        commitments: world.commitments.map((item) => (item.id === ended.id ? ended : item)),
        conflicts: (world.conflicts ?? []).map((item) => (item.id === conflict.id ? conflict : item)),
      },
      input.actor,
      "RESOLVE_CONFLICT",
      conflict.id,
      input.reason.trim(),
    ),
    conflict,
    refund,
  };
}

function bookingForRequest(world: World, requestId: string): Booking | undefined {
  return world.bookings.find((item) => item.requestId === requestId);
}

function refundCancelledBalance(
  world: World,
  obligation: PaymentObligation,
  attempt: PaymentAttempt,
): { world: World; refund: RefundCase } | undefined {
  if (obligation.kind !== "BALANCE") return undefined;
  const booking = bookingForRequest(world, obligation.requestId);
  if (!booking || booking.status !== "CANCELLED") return undefined;
  return makeRefund(world, {
    requestId: obligation.requestId,
    attemptId: attempt.id,
    amount: obligation.amount,
    reason: "BOOKING_CANCELLED",
  });
}

function stayForCommitment(world: World, commitment: Commitment): Stay | undefined {
  if (commitment.stayId) return world.stays.find((item) => item.id === commitment.stayId);
  if (commitment.bookingId) {
    return world.stays.find((item) => item.bookingId === commitment.bookingId);
  }
  return undefined;
}

export function markRefundDone(
  world: World,
  input: { refundId: string; note: string; actor: Actor },
): { world: World; refund: RefundCase } {
  world = expireHolds(world);
  assertAdmin(input.actor);
  if (!input.note.trim()) throw new DomainError("MISSING_REASON", "A note is required");
  const current = (world.refundCases ?? []).find((item) => item.id === input.refundId);
  if (!current) throw new DomainError("NOT_FOUND", "Refund case not found");
  if (current.status !== "OPEN") {
    throw new DomainError("INVALID_TRANSITION", "Refund is already done");
  }
  const refund: RefundCase = {
    ...current,
    status: "DONE",
    note: input.note.trim(),
    resolvedAt: world.now,
  };
  return {
    world: withAudit(
      {
        ...world,
        refundCases: world.refundCases.map((item) => (item.id === refund.id ? refund : item)),
      },
      input.actor,
      "MARK_REFUND_DONE",
      refund.id,
      input.note.trim(),
    ),
    refund,
  };
}

export function stayGuestLabel(status: Stay["status"]): string {
  switch (status) {
    case "SCHEDULED":
      return "Sắp đến";
    case "CHECKED_IN":
      return "Đang lưu trú";
    case "CHECKED_OUT":
      return "Đã trả phòng";
    case "COMPLETED":
      return "Hoàn tất";
    case "DID_NOT_OCCUR":
      return "Không diễn ra";
    case "CANCELLED":
      return "Đã huỷ";
  }
}

export function opsLists(world: World, date: string) {
  const live = world.stays.filter((stay) => stay.status !== "CANCELLED");
  const arriving = live.filter((stay) => stay.checkIn === date);
  const departing = live.filter(
    (stay) =>
      stay.checkOut === date && stay.status !== "DID_NOT_OCCUR" && stay.status !== "SCHEDULED",
  );
  const inHouse = live.filter(
    (stay) => stay.status === "CHECKED_IN" && stay.checkIn < date && date < stay.checkOut,
  );
  return { arriving, inHouse, departing };
}

export function publicStayTotal(villaId: string, checkIn: string, checkOut: string): number {
  const villa = requireVilla(villaId);
  return villa.nightly * nightsBetween(checkIn, checkOut);
}

export function obligationSucceeded(world: World, obligationId: string): boolean {
  return world.attempts.some(
    (attempt) => attempt.obligationId === obligationId && attempt.status === "SUCCEEDED",
  );
}

export function hostToday(world: World, date: string) {
  const pending = world.requests.filter((item) => item.status === "PENDING");
  const lists = opsLists(world, date);
  const openConflicts = (world.conflicts ?? []).filter((item) => item.status === "OPEN");
  const nowMs = parseISO(world.now).getTime();
  const horizon = nowMs + 48 * 60 * 60 * 1000;
  const balancesDue = world.obligations.filter((obligation) => {
    if (obligation.kind !== "BALANCE") return false;
    if (obligationSucceeded(world, obligation.id)) return false;
    const booking = world.bookings.find(
      (item) => item.requestId === obligation.requestId && item.status === "CONFIRMED",
    );
    if (!booking) return false;
    const due = parseISO(obligation.dueAt).getTime();
    return due >= nowMs && due <= horizon;
  });
  return {
    pending,
    arriving: lists.arriving,
    departing: lists.departing,
    openConflicts,
    balancesDue,
  };
}

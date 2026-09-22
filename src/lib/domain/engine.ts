import { parseISO } from "date-fns";
import { isAvailable, isHoldActive } from "./availability.ts";
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
  Booking,
  Commission,
  Commitment,
  PaymentAttempt,
  PaymentObligation,
  PaymentOutcome,
  RefundCase,
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

function reference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 4; i += 1) token += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `STY-${token}`;
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

function assertHost(actor: Actor): void {
  if (actor.persona !== "HOST") {
    throw new DomainError("FORBIDDEN", "Only Host can accept or record payment");
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
  const bookedRequestIds = new Set(world.bookings.map((booking) => booking.requestId));
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
    externalAccommodations: [],
    sales: [{ id: SALE_MAI, name: "Mai" }],
    butlers: [
      { id: BUTLER_LINH, name: "Linh", villaIds: ["sao-bien", "gio-bien", "cat-vang"] },
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
  return { world: { ...world, requests: [request, ...world.requests] }, request };
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
    return { world: replaceRequest(world, request), request };
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
    world: {
      ...replaceRequest(world, request),
      commitments: [...world.commitments, hold],
      obligations,
    },
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
  return { world: replaceRequest(world, request), request };
}

function fulfillInitialSuccess(
  world: World,
  obligation: PaymentObligation,
  hold: Commitment,
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
): { world: World; booking?: Booking; stay?: Stay; refund?: RefundCase } {
  if (obligation.kind !== "INITIAL") return { world };
  if (world.bookings.some((booking) => booking.requestId === obligation.requestId)) {
    return { world };
  }
  const hold = activeHoldFor(world, obligation.requestId);
  if (!hold) {
    const refund: RefundCase = {
      id: nid("ref"),
      requestId: obligation.requestId,
      attemptId: attempt.id,
      amount: obligation.amount,
      reason: "HOLD_EXPIRED",
      status: "OPEN",
      createdAt: world.now,
    };
    return {
      world: { ...world, refundCases: [refund, ...(world.refundCases ?? [])] },
      refund,
    };
  }
  return fulfillInitialSuccess(world, obligation, hold);
}

type PaymentResult = {
  world: World;
  attempt: PaymentAttempt;
  booking?: Booking;
  stay?: Stay;
  refund?: RefundCase;
};

export function recordPayment(
  world: World,
  input: { obligationId: string; outcome: PaymentOutcome; actor: Actor },
): PaymentResult {
  world = expireHolds(world);
  assertHost(input.actor);
  const obligation = requireObligation(world, input.obligationId);
  if (obligation.kind === "BALANCE") {
    if (!world.bookings.some((booking) => booking.requestId === obligation.requestId)) {
      throw new DomainError("NO_BOOKING_YET", "Balance cannot be recorded before a Booking exists");
    }
  }
  if (hasUnresolvedUnknown(world, obligation.id)) {
    throw new DomainError("ATTEMPT_UNRESOLVED", "An unknown attempt must be resolved first");
  }
  const attempt: PaymentAttempt = {
    id: nid("att"),
    obligationId: obligation.id,
    status: input.outcome,
    at: world.now,
  };
  world = { ...world, attempts: [attempt, ...world.attempts] };

  if (input.outcome !== "SUCCEEDED" || obligation.kind !== "INITIAL") {
    return { world, attempt };
  }

  const applied = applyInitialSuccess(world, obligation, attempt);
  return { world: applied.world, attempt, booking: applied.booking, stay: applied.stay, refund: applied.refund };
}

export function resolveUnknown(
  world: World,
  input: { attemptId: string; outcome: "SUCCEEDED" | "FAILED"; actor: Actor },
): PaymentResult {
  world = expireHolds(world);
  assertHost(input.actor);
  const current = world.attempts.find((item) => item.id === input.attemptId);
  if (!current) throw new DomainError("NOT_FOUND", "Attempt not found");
  if (current.status !== "UNKNOWN") {
    throw new DomainError("INVALID_TRANSITION", "Only an unknown attempt can be resolved");
  }
  const attempt: PaymentAttempt = { ...current, status: input.outcome, at: world.now };
  world = {
    ...world,
    attempts: world.attempts.map((item) => (item.id === attempt.id ? attempt : item)),
  };
  if (input.outcome !== "SUCCEEDED") return { world, attempt };
  const obligation = requireObligation(world, attempt.obligationId);
  const applied = applyInitialSuccess(world, obligation, attempt);
  return { world: applied.world, attempt, booking: applied.booking, stay: applied.stay, refund: applied.refund };
}

export function checkInStay(
  world: World,
  input: { stayId: string; actor: Actor },
): { world: World; stay: Stay } {
  world = expireHolds(world);
  const stay = requireStay(world, input.stayId);
  assertButlerAssigned(world, input.actor, stay.villaId);
  if (stay.status !== "SCHEDULED") {
    throw new DomainError("INVALID_TRANSITION", "Check-in is only possible from scheduled");
  }
  const updated: Stay = { ...stay, status: "CHECKED_IN", checkedInAt: world.now };
  return { world: replaceStay(world, updated), stay: updated };
}

export function checkOutStay(
  world: World,
  input: { stayId: string; actor: Actor },
): { world: World; stay: Stay } {
  world = expireHolds(world);
  const stay = requireStay(world, input.stayId);
  assertButlerAssigned(world, input.actor, stay.villaId);
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
    item.stayId === stay.id ? { ...item, status: "EARNED" as const } : item,
  );
  return {
    world: { ...replaceStay(world, completed), commissions },
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
  return { world: replaceStay(world, updated), stay: updated };
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
  return {
    world: {
      ...world,
      incidents: [
        {
          id: nid("inc"),
          stayId: stay.id,
          villaId: stay.villaId,
          note: input.note.trim(),
          hasPhoto: input.hasPhoto,
          createdAt: world.now,
          createdBy: "BUTLER",
        },
        ...world.incidents,
      ],
    },
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
  }
}

export function opsLists(world: World, date: string) {
  const arriving = world.stays.filter((stay) => stay.checkIn === date);
  const departing = world.stays.filter(
    (stay) =>
      stay.checkOut === date && stay.status !== "DID_NOT_OCCUR" && stay.status !== "SCHEDULED",
  );
  const inHouse = world.stays.filter(
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

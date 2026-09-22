import { differenceInCalendarDays, parseISO } from "date-fns";
import { isAvailable } from "./availability.ts";
import {
  BUTLER_LINH,
  COMMISSION_RATE,
  HOLD_MS,
  paymentRuleOf,
  requireVilla,
  SALE_MAI,
} from "./catalog.ts";
import type {
  Actor,
  Booking,
  Commission,
  Commitment,
  Stay,
  StayRequest,
  World,
} from "./types.ts";
import { DomainError } from "./types.ts";

export { DomainError, isAvailable };
export type { World };

function nid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
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

function assertHost(actor: Actor): void {
  if (actor.persona !== "HOST") {
    throw new DomainError("FORBIDDEN", "Only Host can accept or confirm a request");
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

export function createEmptyWorld(now: string): World {
  return {
    now,
    requests: [],
    bookings: [],
    stays: [],
    commitments: [],
    incidents: [],
    commissions: [],
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
    paymentRule: paymentRuleOf(input.villaId),
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
  assertHost(input.actor);
  const current = requireRequest(world, input.requestId);
  if (current.status !== "PENDING") {
    throw new DomainError("INVALID_TRANSITION", "Only a pending request can be accepted");
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
    requestId: request.id,
  };
  return {
    world: {
      ...replaceRequest(world, request),
      commitments: [...world.commitments, hold],
    },
    request,
  };
}

export function confirmRequest(
  world: World,
  input: { requestId: string; actor: Actor },
): { world: World; request: StayRequest; booking: Booking; stay: Stay } {
  assertHost(input.actor);
  const current = requireRequest(world, input.requestId);
  if (current.status !== "ACCEPTED") {
    throw new DomainError("INVALID_TRANSITION", "Only an accepted request can be confirmed");
  }
  const bookingId = nid("bkg");
  const stayId = nid("sty");
  const ref = reference();
  const request: StayRequest = {
    ...current,
    status: "CONFIRMED",
    confirmedAt: world.now,
    reference: ref,
    bookingId,
    stayId,
  };
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
    paymentRule: request.paymentRule,
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
  const commitment: Commitment = {
    id: nid("cmt"),
    villaId: request.villaId,
    start: request.checkIn,
    end: request.checkOut,
    kind: "CONFIRMED_ACCOMMODATION",
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
      ...replaceRequest(world, request),
      bookings: [booking, ...world.bookings],
      stays: [stay, ...world.stays],
      commitments: [
        ...world.commitments.filter(
          (item) => !(item.kind === "HOLD" && item.requestId === request.id),
        ),
        commitment,
      ],
      commissions,
    },
    request,
    booking,
    stay,
  };
}

export function confirmGuestRequest(world: World, requestId: string) {
  const pending = requireRequest(world, requestId);
  let next = world;
  if (pending.status === "PENDING") {
    next = acceptRequest(next, { requestId, actor: { persona: "HOST" } }).world;
  }
  const accepted = requireRequest(next, requestId);
  if (accepted.status === "CONFIRMED") {
    return {
      world: next,
      request: accepted,
      booking: next.bookings.find((item) => item.id === accepted.bookingId)!,
      stay: next.stays.find((item) => item.id === accepted.stayId)!,
    };
  }
  return confirmRequest(next, { requestId, actor: { persona: "HOST" } });
}

export function checkInStay(
  world: World,
  input: { stayId: string; actor: Actor },
): { world: World; stay: Stay } {
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
  const stay = requireStay(world, input.stayId);
  assertButlerAssigned(world, input.actor, stay.villaId);
  if (stay.status !== "CHECKED_IN") {
    throw new DomainError("INVALID_TRANSITION", "Check-out is only possible after check-in");
  }
  const checkedOut: Stay = {
    ...stay,
    status: "CHECKED_OUT",
    checkedOutAt: world.now,
  };
  const completed: Stay = {
    ...checkedOut,
    status: "COMPLETED",
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

export { BUTLER_LINH, SALE_MAI };

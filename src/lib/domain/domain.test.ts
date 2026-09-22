import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BUTLER_LINH, paymentPlan, SALE_MAI } from "./catalog.ts";
import { HOLD_MS } from "./config.ts";
import { overlappingActive } from "./availability.ts";
import {
  acceptRequest,
  advanceTime,
  checkInStay,
  checkOutStay,
  createBlock,
  createEmptyWorld,
  createRequest,
  DomainError,
  isAvailable,
  markDidNotOccur,
  markRefundDone,
  opsLists,
  recordExternalBooking,
  recordPayment,
  rejectRequest,
  releaseBlock,
  reportIncident,
  resolveConflict,
  resolveUnknown,
} from "./engine.ts";
import { seedWorld } from "./seed.ts";
import type { Actor, PaymentOutcome, World } from "./types.ts";

const HOST: Actor = { persona: "HOST" };
const ADMIN: Actor = { persona: "ADMIN" };
const GUEST: Actor = { persona: "GUEST" };
const SALE: Actor = { persona: "SALE", saleId: SALE_MAI };
const BUTLER: Actor = { persona: "BUTLER", butlerId: BUTLER_LINH };
const BQL: Actor = { persona: "BQL" };
const NOW = "2026-09-22T03:00:00.000Z";

function assertNoOverlap(world: World) {
  const pairs = overlappingActive(world);
  assert.equal(
    pairs.length,
    0,
    pairs
      .map(([a, b]) => `${a.id}/${b.id} on ${a.villaId} ${a.start}-${a.end} vs ${b.start}-${b.end}`)
      .join("; "),
  );
}

function assertConflictsRecorded(world: World) {
  const pairs = overlappingActive(world);
  assert.ok(pairs.length > 0, "expected overlapping ACTIVE commitments");
  for (const [a, b] of pairs) {
    const recorded = (world.conflicts ?? []).some(
      (conflict) =>
        conflict.status === "OPEN" &&
        conflict.commitmentIds.includes(a.id) &&
        conflict.commitmentIds.includes(b.id),
    );
    assert.equal(recorded, true, `no OPEN conflict covering ${a.id}/${b.id}`);
  }
}

function initialOf(world: World, requestId: string) {
  const obligation = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "INITIAL",
  );
  assert.ok(obligation, "missing INITIAL obligation");
  return obligation;
}

function balanceOf(world: World, requestId: string) {
  const obligation = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "BALANCE",
  );
  assert.ok(obligation, "missing BALANCE obligation");
  return obligation;
}

function pay(
  world: World,
  requestId: string,
  outcome: PaymentOutcome = "SUCCEEDED",
) {
  return recordPayment(world, {
    obligationId: initialOf(world, requestId).id,
    outcome,
    actor: ADMIN,
  });
}

function shape(world: World, requestId: string) {
  const request = world.requests.find((item) => item.id === requestId)!;
  const booking = world.bookings.find((item) => item.requestId === requestId)!;
  const stay = world.stays.find((item) => item.id === booking.stayId)!;
  const commitment = world.commitments.find(
    (item) => item.bookingId === booking.id && item.kind === "CONFIRMED_ACCOMMODATION",
  )!;
  return {
    villaId: booking.villaId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    nightly: booking.nightly,
    nights: booking.nights,
    total: booking.total,
    stayStatus: stay.status,
    stayOrigin: stay.origin,
    stayGuests: stay.guests,
    stayVilla: stay.villaId,
    stayDates: `${stay.checkIn}:${stay.checkOut}`,
    bookingStatus: booking.status,
    commitmentKind: commitment.kind,
    commitmentRange: `${commitment.start}:${commitment.end}`,
    requestStatus: request.status,
  };
}

function bookedStay(actor: Actor = GUEST) {
  let world = createEmptyWorld(NOW);
  const created = createRequest(world, {
    villaId: "sao-bien",
    checkIn: "2026-12-01",
    checkOut: "2026-12-04",
    guests: 4,
    guestName: "Mai",
    actor,
  });
  world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
  const paid = pay(world, created.request.id);
  world = paid.world;
  assertNoOverlap(world);
  return {
    world,
    requestId: created.request.id,
    stayId: paid.stay!.id,
    bookingId: paid.booking!.id,
  };
}

describe("Sale request converges with a direct Guest request", () => {
  it("produces the same Booking and Stay shape after Host accept + payment", () => {
    let guestWorld = createEmptyWorld(NOW);
    const guestCreated = createRequest(guestWorld, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    guestWorld = acceptRequest(guestCreated.world, {
      requestId: guestCreated.request.id,
      actor: HOST,
    }).world;
    guestWorld = pay(guestWorld, guestCreated.request.id).world;

    let saleWorld = createEmptyWorld(NOW);
    const saleCreated = createRequest(saleWorld, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: SALE,
    });
    saleWorld = acceptRequest(saleCreated.world, {
      requestId: saleCreated.request.id,
      actor: HOST,
    }).world;
    saleWorld = pay(saleWorld, saleCreated.request.id).world;

    assert.deepEqual(
      shape(guestWorld, guestCreated.request.id),
      shape(saleWorld, saleCreated.request.id),
    );
    assert.equal(guestWorld.requests[0]?.source, "GUEST");
    assert.equal(saleWorld.requests[0]?.source, "SALE");
    assert.equal(saleWorld.requests[0]?.saleId, SALE_MAI);
    assert.equal(guestWorld.commissions.length, 0);
    assert.equal(saleWorld.commissions.length, 1);
    assertNoOverlap(guestWorld);
    assertNoOverlap(saleWorld);
  });
});

describe("Sale commission", () => {
  it("is 10% of accommodation total, only on bookings with that saleId, and stays Chờ until COMPLETED", () => {
    let world = createEmptyWorld(NOW);
    const saleStay = createRequest(world, {
      villaId: "sao-bien",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 4,
      guestName: "Gia Phạm",
      actor: SALE,
    });
    world = saleStay.world;
    const guestStay = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      guestName: "Linh",
      actor: GUEST,
    });
    world = guestStay.world;

    world = acceptRequest(world, { requestId: saleStay.request.id, actor: HOST }).world;
    world = pay(world, saleStay.request.id).world;
    world = acceptRequest(world, { requestId: guestStay.request.id, actor: HOST }).world;
    world = pay(world, guestStay.request.id).world;

    const saleCommission = world.commissions.filter((item) => item.saleId === SALE_MAI);
    assert.equal(saleCommission.length, 1);
    assert.equal(saleCommission[0]?.amount, Math.round(saleStay.request.total * 0.1));
    assert.equal(saleCommission[0]?.status, "PENDING");
    assert.equal(
      world.commissions.some(
        (item) =>
          item.bookingId ===
          world.bookings.find((booking) => booking.requestId === guestStay.request.id)?.id,
      ),
      false,
    );

    const stayId = world.bookings.find((item) => item.requestId === saleStay.request.id)?.stayId;
    assert.ok(stayId);
    world = checkInStay(world, { stayId, actor: BUTLER }).world;
    world = checkOutStay(world, { stayId, actor: BUTLER }).world;
    assert.equal(world.commissions.find((item) => item.stayId === stayId)?.status, "EARNED");
    assert.equal(world.stays.find((item) => item.id === stayId)?.status, "COMPLETED");
    assertNoOverlap(world);
  });
});

describe("Stay transitions", () => {
  it("refuses DID_NOT_OCCUR from CHECKED_IN", () => {
    const booked = bookedStay();
    const world = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    assert.throws(
      () => markDidNotOccur(world, { stayId: booked.stayId, actor: BUTLER, reason: "Khách báo hủy trễ" }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
    assertNoOverlap(world);
  });

  it("BQL cannot call any Stay transition", () => {
    const booked = bookedStay();
    assert.throws(
      () => checkInStay(booked.world, { stayId: booked.stayId, actor: BQL }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    const world = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    assert.throws(
      () => checkOutStay(world, { stayId: booked.stayId, actor: BQL }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    const other = bookedStay();
    assert.throws(
      () =>
        markDidNotOccur(other.world, {
          stayId: other.stayId,
          actor: BQL,
          reason: "Không",
        }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    assertNoOverlap(booked.world);
    assertNoOverlap(world);
    assertNoOverlap(other.world);
  });

  it("completing a Stay does not end its CONFIRMED_ACCOMMODATION commitment", () => {
    const booked = bookedStay();
    let world = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    world = checkOutStay(world, { stayId: booked.stayId, actor: BUTLER }).world;
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "COMPLETED");
    const commitment = world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.kind === "CONFIRMED_ACCOMMODATION",
    );
    assert.ok(commitment);
    assert.equal(commitment.status, "ACTIVE");
    assert.equal(isAvailable(world, "sao-bien", "2026-12-01", "2026-12-04"), false);
    assertNoOverlap(world);
  });

  it("DID_NOT_OCCUR does not release inventory", () => {
    const booked = bookedStay();
    const world = markDidNotOccur(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      reason: "Khách báo bận đột xuất",
    }).world;
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "DID_NOT_OCCUR");
    const commitment = world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.kind === "CONFIRMED_ACCOMMODATION",
    );
    assert.ok(commitment);
    assert.equal(commitment.status, "ACTIVE");
    assert.equal(isAvailable(world, "sao-bien", "2026-12-01", "2026-12-04"), false);
    assertNoOverlap(world);
  });

  it("an incident does not change Booking, Stay, or commitments", () => {
    const booked = bookedStay();
    const before = {
      bookings: booked.world.bookings,
      stays: booked.world.stays,
      commitments: booked.world.commitments,
    };
    const world = reportIncident(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      note: "Máy lạnh phòng master kêu",
      hasPhoto: true,
    }).world;
    assert.equal(world.bookings, before.bookings);
    assert.equal(world.stays, before.stays);
    assert.equal(world.commitments, before.commitments);
    assert.equal(world.incidents.length, 1);
    assert.equal(world.incidents[0]?.note, "Máy lạnh phòng master kêu");
    assert.equal(world.incidents[0]?.hasPhoto, true);
    assertNoOverlap(world);
  });

  it("Sale cannot accept a request", () => {
    const created = createRequest(createEmptyWorld(NOW), {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 2,
      guestName: "An",
      actor: SALE,
    });
    assert.throws(
      () => acceptRequest(created.world, { requestId: created.request.id, actor: SALE }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    assertNoOverlap(created.world);
  });
});

describe("Butler today board", () => {
  it("groups seed stays for 22/9 without treating external as second-class", () => {
    const world = seedWorld();
    const lists = opsLists(world, "2026-09-22");
    assert.deepEqual(
      lists.arriving.map((stay) => stay.villaId).sort(),
      ["gio-bien", "minh-dam"],
    );
    assert.deepEqual(
      lists.departing.map((stay) => stay.villaId),
      ["sao-bien"],
    );
    assert.equal(lists.inHouse.length, 1);
    assert.equal(lists.inHouse[0]?.origin, "EXTERNAL");
    assert.equal(lists.inHouse[0]?.originLabel, "Khách quen");
    assert.equal(lists.inHouse[0]?.guestName, "Gia đình Trần");
    assertNoOverlap(world);
  });
});

describe("Availability and overlapping requests", () => {
  it("two PENDING requests on the same dates → villa still available", () => {
    let world = createEmptyWorld(NOW);
    const first = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = first.world;
    const second = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = second.world;
    assert.equal(isAvailable(world, "sen-hong", "2026-12-01", "2026-12-04"), true);
    assert.equal(world.requests.filter((item) => item.status === "PENDING").length, 2);
    assertNoOverlap(world);
  });

  it("accept first → accept second → second is CONFLICTED, exactly 1 ACTIVE HOLD", () => {
    let world = createEmptyWorld(NOW);
    const first = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = first.world;
    const second = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = second.world;
    world = acceptRequest(world, { requestId: first.request.id, actor: HOST }).world;
    world = acceptRequest(world, { requestId: second.request.id, actor: HOST }).world;
    assert.equal(world.requests.find((item) => item.id === first.request.id)?.status, "ACCEPTED");
    assert.equal(world.requests.find((item) => item.id === second.request.id)?.status, "CONFLICTED");
    const activeHolds = world.commitments.filter(
      (item) => item.kind === "HOLD" && item.status === "ACTIVE",
    );
    assert.equal(activeHolds.length, 1);
    assert.equal(activeHolds[0]?.requestId, first.request.id);
    assertNoOverlap(world);
  });

  it("reject is refused from ACCEPTED", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    assert.throws(
      () => rejectRequest(world, { requestId: created.request.id, actor: HOST }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
    assertNoOverlap(world);
  });
});

describe("Payment confirmation", () => {
  it("INITIAL SUCCEEDED → 1 Booking, HOLD ENDED/SUPERSEDED (still in the list), 1 CONFIRMED_ACCOMMODATION, 1 Stay; ids all different", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    const paid = pay(world, created.request.id);
    world = paid.world;
    assert.equal(world.bookings.length, 1);
    assert.equal(world.stays.length, 1);
    const hold = world.commitments.find((item) => item.kind === "HOLD");
    assert.ok(hold);
    assert.equal(hold.status, "ENDED");
    assert.equal(hold.endedReason, "SUPERSEDED");
    const confirmed = world.commitments.filter(
      (item) => item.kind === "CONFIRMED_ACCOMMODATION" && item.status === "ACTIVE",
    );
    assert.equal(confirmed.length, 1);
    assert.notEqual(created.request.id, paid.booking!.id);
    assert.notEqual(created.request.id, paid.stay!.id);
    assert.notEqual(paid.booking!.id, paid.stay!.id);
    assert.equal(world.requests.find((item) => item.id === created.request.id)?.status, "ACCEPTED");
    assertNoOverlap(world);
  });

  it("UNKNOWN → no Booking; second attempt refused; resolveUnknown SUCCEEDED while hold active → Booking created", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    const unknown = pay(world, created.request.id, "UNKNOWN");
    world = unknown.world;
    assert.equal(world.bookings.length, 0);
    assert.throws(
      () => pay(world, created.request.id, "SUCCEEDED"),
      (error: unknown) => error instanceof DomainError && error.code === "ATTEMPT_UNRESOLVED",
    );
    const resolved = resolveUnknown(world, {
      attemptId: unknown.attempt.id,
      outcome: "SUCCEEDED",
      actor: ADMIN,
    });
    world = resolved.world;
    assert.equal(world.bookings.length, 1);
    assert.ok(resolved.booking);
    assertNoOverlap(world);
  });

  it("late SUCCEEDED after expiry → attempt stored as SUCCEEDED, 1 OPEN RefundCase, 0 Bookings", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    world = advanceTime(world, 31 * 60 * 1000);
    assert.equal(world.requests.find((item) => item.id === created.request.id)?.status, "EXPIRED");
    assert.equal(isAvailable(world, "sen-hong", "2026-12-01", "2026-12-04"), true);
    const paid = pay(world, created.request.id, "SUCCEEDED");
    world = paid.world;
    assert.equal(paid.attempt.status, "SUCCEEDED");
    assert.equal(world.attempts.filter((item) => item.status === "SUCCEEDED").length, 1);
    assert.equal(world.refundCases.length, 1);
    assert.equal(world.refundCases[0]?.status, "OPEN");
    assert.equal(world.refundCases[0]?.reason, "HOLD_EXPIRED");
    assert.equal(world.refundCases[0]?.attemptId, paid.attempt.id);
    assert.equal(world.refundCases[0]?.requestId, created.request.id);
    assert.equal(world.bookings.length, 0);
    assert.equal(paid.refund?.status, "OPEN");
    assertNoOverlap(world);
  });

  it("UNKNOWN → expiry → another guest books → resolveUnknown(SUCCEEDED) → attempt stored SUCCEEDED, RefundCase OPEN, still exactly 1 Booking and no overlap", () => {
    let world = createEmptyWorld(NOW);
    const first = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(first.world, { requestId: first.request.id, actor: HOST }).world;
    const unknown = pay(world, first.request.id, "UNKNOWN");
    world = unknown.world;
    world = advanceTime(world, 31 * 60 * 1000);
    assert.equal(isAvailable(world, "sen-hong", "2026-12-01", "2026-12-04"), true);

    const second = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = acceptRequest(second.world, { requestId: second.request.id, actor: HOST }).world;
    world = pay(world, second.request.id, "SUCCEEDED").world;
    assert.equal(world.bookings.length, 1);
    assert.equal(world.bookings[0]?.requestId, second.request.id);

    const resolved = resolveUnknown(world, {
      attemptId: unknown.attempt.id,
      outcome: "SUCCEEDED",
      actor: ADMIN,
    });
    world = resolved.world;
    const firstAttempt = world.attempts.find((item) => item.id === unknown.attempt.id);
    assert.equal(firstAttempt?.status, "SUCCEEDED");
    assert.equal(world.refundCases.length, 1);
    assert.equal(world.refundCases[0]?.status, "OPEN");
    assert.equal(world.refundCases[0]?.requestId, first.request.id);
    assert.equal(world.bookings.length, 1);
    assert.equal(world.bookings[0]?.requestId, second.request.id);
    assert.equal(resolved.booking, undefined);
    assertNoOverlap(world);
  });

  it("BALANCE before Booking → NO_BOOKING_YET, nothing stored", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    const balance = balanceOf(world, created.request.id);
    assert.throws(
      () =>
        recordPayment(world, {
          obligationId: balance.id,
          outcome: "SUCCEEDED",
          actor: ADMIN,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "NO_BOOKING_YET",
    );
    assert.equal(world.attempts.length, 0);
    assert.equal(world.bookings.length, 0);
    assertNoOverlap(world);
  });

  it("BALANCE after Booking → stored; Booking unchanged", () => {
    const booked = bookedStay();
    const booking = booked.world.bookings.find((item) => item.id === booked.bookingId);
    assert.ok(booking);
    const balance = balanceOf(booked.world, booked.requestId);
    const paid = recordPayment(booked.world, {
      obligationId: balance.id,
      outcome: "SUCCEEDED",
      actor: ADMIN,
    });
    assert.equal(paid.attempt.status, "SUCCEEDED");
    assert.equal(paid.attempt.obligationId, balance.id);
    assert.equal(paid.world.attempts[0]?.id, paid.attempt.id);
    assert.deepEqual(paid.world.bookings[0], booking);
    assert.equal(paid.world.bookings.length, 1);
    assert.equal(paid.booking, undefined);
    assertNoOverlap(paid.world);
  });

  it("check-in 2026-11-02 → BALANCE dueAt = 2026-11-01T07:00:00.000Z", () => {
    const plan = paymentPlan(10_000_000, "2026-11-02", NOW);
    assert.equal(plan.length, 2);
    assert.equal(plan[1]?.kind, "BALANCE");
    assert.equal(plan[1]?.dueAt, "2026-11-01T07:00:00.000Z");
    assertNoOverlap(createEmptyWorld(NOW));
  });

  it("check-in 10 days ahead → 50/50; check-in 12h ahead → 100%, same villa", () => {
    const total = 6_200_000 * 3;
    const far = paymentPlan(total, "2026-10-02", NOW);
    assert.equal(far.length, 2);
    assert.equal(far[0]?.kind, "INITIAL");
    assert.equal(far[0]?.amount, Math.round(total / 2));
    assert.equal(far[1]?.kind, "BALANCE");
    assert.equal(far[1]?.amount, total - Math.round(total / 2));

    const near = paymentPlan(total, "2026-09-23", "2026-09-22T12:00:00.000Z");
    assert.equal(near.length, 1);
    assert.equal(near[0]?.kind, "INITIAL");
    assert.equal(near[0]?.amount, total);

    let world = createEmptyWorld(NOW);
    const farReq = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-10-02",
      checkOut: "2026-10-05",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(farReq.world, { requestId: farReq.request.id, actor: HOST }).world;
    assert.equal(
      world.obligations.filter((item) => item.requestId === farReq.request.id).length,
      2,
    );

    world = createEmptyWorld("2026-09-22T12:00:00.000Z");
    const nearReq = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-09-23",
      checkOut: "2026-09-26",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(nearReq.world, { requestId: nearReq.request.id, actor: HOST }).world;
    const nearObligations = world.obligations.filter(
      (item) => item.requestId === nearReq.request.id,
    );
    assert.equal(nearObligations.length, 1);
    assert.equal(nearObligations[0]?.amount, 6_200_000 * 3);
    assertNoOverlap(world);
  });
});

describe("Seed and engine surface", () => {
  it("seedWorld(): no Booking exists for any Stay with origin EXTERNAL", () => {
    const world = seedWorld();
    const external = world.stays.filter((stay) => stay.origin === "EXTERNAL");
    assert.ok(external.length >= 1);
    for (const stay of external) {
      assert.equal(stay.bookingId, undefined);
      assert.equal(
        world.bookings.some((booking) => booking.stayId === stay.id),
        false,
      );
    }
    assert.equal(world.externalAccommodations[0]?.source, "Khách quen");
    assertNoOverlap(world);
  });

  it("no exported function creates a Booking except recordPayment/resolveUnknown", () => {
    const src = readFileSync(new URL("./engine.ts", import.meta.url), "utf8");
    assert.equal(src.includes("confirmGuestRequest"), false);
    assert.equal(/export function confirmRequest\b/.test(src), false);
    assert.ok(/export function recordPayment\b/.test(src));
    assert.ok(/export function resolveUnknown\b/.test(src));
    assert.equal(/export function fulfillInitialSuccess\b/.test(src), false);
    assert.ok(src.includes("fulfillInitialSuccess("));
    const constructors = [...src.matchAll(/bookings:\s*\[\s*booking/g)];
    assert.equal(constructors.length, 1);
    assert.ok(HOLD_MS === 30 * 60 * 1000);
    assertNoOverlap(createEmptyWorld(NOW));
  });
});

describe("Phase 2 host calendar, external, admin", () => {
  it("duplicate INITIAL SUCCEEDED → 2 attempts, RefundCase DUPLICATE_PAYMENT, 1 Booking", () => {
    const booked = bookedStay();
    const second = pay(booked.world, booked.requestId, "SUCCEEDED");
    assert.equal(second.world.attempts.filter((item) => item.status === "SUCCEEDED").length, 2);
    assert.equal(second.world.bookings.length, 1);
    assert.equal(second.world.bookings[0]?.id, booked.bookingId);
    assert.equal(second.world.refundCases.length, 1);
    assert.equal(second.world.refundCases[0]?.reason, "DUPLICATE_PAYMENT");
    assert.equal(second.world.refundCases[0]?.status, "OPEN");
    assertNoOverlap(second.world);
  });

  it("Host cannot recordPayment; ADMIN can", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    assert.throws(
      () =>
        recordPayment(world, {
          obligationId: initialOf(world, created.request.id).id,
          outcome: "SUCCEEDED",
          actor: HOST,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    const paid = recordPayment(world, {
      obligationId: initialOf(world, created.request.id).id,
      outcome: "SUCCEEDED",
      actor: ADMIN,
    });
    assert.equal(paid.world.bookings.length, 1);
    assertNoOverlap(paid.world);
  });

  it("external booking on free dates → commitment + Stay, 0 Bookings, 0 obligations", () => {
    const result = recordExternalBooking(createEmptyWorld(NOW), {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Airbnb",
      guestName: "Hoa",
      actor: HOST,
    });
    assert.equal(result.stay.origin, "EXTERNAL");
    assert.equal(result.stay.originLabel, "Airbnb");
    assert.equal(result.stay.status, "SCHEDULED");
    assert.equal(result.commitment.kind, "CONFIRMED_ACCOMMODATION");
    assert.equal(result.commitment.basis, "EXTERNAL");
    assert.equal(result.commitment.status, "ACTIVE");
    assert.equal(result.world.bookings.length, 0);
    assert.equal(result.world.obligations.length, 0);
    assert.equal(result.world.requests.length, 0);
    assert.equal(result.world.commissions.length, 0);
    assert.equal(result.conflict, undefined);
    assertNoOverlap(result.world);
  });

  it("external overlapping a Stayora booking → both ACTIVE, 1 OPEN conflict", () => {
    const booked = bookedStay();
    const result = recordExternalBooking(booked.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 4,
      source: "Booking.com",
      actor: HOST,
    });
    const stayora = result.world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.status === "ACTIVE",
    );
    assert.ok(stayora);
    assert.equal(result.commitment.status, "ACTIVE");
    assert.equal(result.world.conflicts.length, 1);
    assert.equal(result.world.conflicts[0]?.status, "OPEN");
    assert.ok(result.world.conflicts[0]?.commitmentIds.includes(stayora.id));
    assert.ok(result.world.conflicts[0]?.commitmentIds.includes(result.commitment.id));
    assertConflictsRecorded(result.world);
  });

  it("external overlapping an ACTIVE HOLD → INITIAL SUCCEEDED → no Booking, RefundCase INVENTORY_CONFLICT", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    const hold = world.commitments.find((item) => item.kind === "HOLD" && item.status === "ACTIVE");
    assert.ok(hold);
    const external = recordExternalBooking(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Zalo",
      actor: HOST,
    });
    world = external.world;
    assert.equal(hold.status, "ACTIVE");
    assert.equal(world.commitments.find((item) => item.id === hold.id)?.status, "ACTIVE");
    assert.equal(world.conflicts[0]?.status, "OPEN");
    const paid = pay(world, created.request.id, "SUCCEEDED");
    world = paid.world;
    assert.equal(world.bookings.length, 0);
    assert.equal(world.refundCases[0]?.reason, "INVENTORY_CONFLICT");
    assert.equal(world.refundCases[0]?.status, "OPEN");
    assert.equal(paid.attempt.status, "SUCCEEDED");
    assertConflictsRecorded(world);
  });

  it("block on an occupied range → NOT_AVAILABLE", () => {
    const booked = bookedStay();
    assert.throws(
      () =>
        createBlock(booked.world, {
          villaId: "sao-bien",
          start: "2026-12-01",
          end: "2026-12-04",
          blockKind: "OWNER",
          actor: HOST,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "NOT_AVAILABLE",
    );
    assertNoOverlap(booked.world);
  });

  it("releaseBlock on CONFIRMED_ACCOMMODATION → refused", () => {
    const booked = bookedStay();
    const confirmed = booked.world.commitments.find(
      (item) => item.bookingId === booked.bookingId,
    );
    assert.ok(confirmed);
    assert.throws(
      () => releaseBlock(booked.world, { commitmentId: confirmed.id, actor: HOST }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
    assertNoOverlap(booked.world);
  });

  it("resolveConflict ending the Stayora commitment → Booking CANCELLED, RefundCase CONFLICT_RESOLUTION, conflict RESOLVED, no overlap remaining", () => {
    const booked = bookedStay();
    const external = recordExternalBooking(booked.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 4,
      source: "Khách quen",
      actor: HOST,
    });
    const stayora = external.world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.status === "ACTIVE",
    );
    assert.ok(stayora);
    const resolved = resolveConflict(external.world, {
      conflictId: external.world.conflicts[0]!.id,
      keepCommitmentId: external.commitment.id,
      endCommitmentId: stayora.id,
      reason: "Giữ đặt Airbnb đã nhận",
      actor: ADMIN,
    });
    assert.equal(resolved.conflict.status, "RESOLVED");
    assert.equal(
      resolved.world.bookings.find((item) => item.id === booked.bookingId)?.status,
      "CANCELLED",
    );
    assert.equal(
      resolved.world.stays.find((item) => item.id === booked.stayId)?.status,
      "CANCELLED",
    );
    assert.equal(resolved.world.refundCases[0]?.reason, "CONFLICT_RESOLUTION");
    assert.equal(resolved.world.refundCases[0]?.status, "OPEN");
    assert.equal(
      resolved.world.commitments.find((item) => item.id === stayora.id)?.status,
      "ENDED",
    );
    assert.equal(
      resolved.world.commitments.find((item) => item.id === stayora.id)?.endedReason,
      "RELEASED",
    );
    assert.equal(
      resolved.world.commitments.find((item) => item.id === external.commitment.id)?.status,
      "ACTIVE",
    );
    assertNoOverlap(resolved.world);
  });

  it("end Stayora commitment → Booking CANCELLED, Stay CANCELLED, Commission VOID, stay not in opsLists, checkInStay refused, RefundCase CONFLICT_RESOLUTION", () => {
    const booked = bookedStay(SALE);
    const external = recordExternalBooking(booked.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 4,
      source: "Airbnb",
      actor: HOST,
    });
    const stayora = external.world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.status === "ACTIVE",
    )!;
    const resolved = resolveConflict(external.world, {
      conflictId: external.world.conflicts[0]!.id,
      keepCommitmentId: external.commitment.id,
      endCommitmentId: stayora.id,
      reason: "Giữ Airbnb",
      actor: ADMIN,
    });
    assert.equal(resolved.world.bookings.find((item) => item.id === booked.bookingId)?.status, "CANCELLED");
    assert.equal(resolved.world.stays.find((item) => item.id === booked.stayId)?.status, "CANCELLED");
    assert.equal(resolved.world.commissions[0]?.status, "VOID");
    assert.equal(resolved.world.refundCases[0]?.reason, "CONFLICT_RESOLUTION");
    const lists = opsLists(resolved.world, "2026-12-01");
    assert.equal(
      lists.arriving.some((stay) => stay.id === booked.stayId),
      false,
    );
    assert.throws(
      () => checkInStay(resolved.world, { stayId: booked.stayId, actor: BUTLER }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
    assertNoOverlap(resolved.world);
  });

  it("end EXTERNAL commitment → its Stay CANCELLED, not in opsLists", () => {
    const booked = bookedStay();
    const external = recordExternalBooking(booked.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Zalo",
      actor: HOST,
    });
    const stayora = external.world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.status === "ACTIVE",
    )!;
    const resolved = resolveConflict(external.world, {
      conflictId: external.world.conflicts[0]!.id,
      keepCommitmentId: stayora.id,
      endCommitmentId: external.commitment.id,
      reason: "Giữ Stayora",
      actor: ADMIN,
    });
    assert.equal(resolved.world.stays.find((item) => item.id === external.stay.id)?.status, "CANCELLED");
    assert.equal(
      opsLists(resolved.world, "2026-12-01").arriving.some((stay) => stay.id === external.stay.id),
      false,
    );
    assert.equal(resolved.world.bookings.find((item) => item.id === booked.bookingId)?.status, "CONFIRMED");
    assertNoOverlap(resolved.world);
  });

  it("end HOLD → Request CONFLICTED", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    const hold = world.commitments.find((item) => item.kind === "HOLD" && item.status === "ACTIVE")!;
    const external = recordExternalBooking(world, {
      villaId: "sen-hong",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Airbnb",
      actor: HOST,
    });
    const resolved = resolveConflict(external.world, {
      conflictId: external.world.conflicts[0]!.id,
      keepCommitmentId: external.commitment.id,
      endCommitmentId: hold.id,
      reason: "Giữ đặt ngoài",
      actor: ADMIN,
    });
    assert.equal(
      resolved.world.requests.find((item) => item.id === created.request.id)?.status,
      "CONFLICTED",
    );
    assert.equal(resolved.world.commitments.find((item) => item.id === hold.id)?.status, "ENDED");
    assertNoOverlap(resolved.world);
  });

  it("ending a commitment whose Stay is CHECKED_IN → STAY_IN_PROGRESS, nothing changed", () => {
    const booked = bookedStay();
    const checked = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    const external = recordExternalBooking(checked, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Booking.com",
      actor: HOST,
    });
    const stayora = external.world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.status === "ACTIVE",
    )!;
    const before = external.world;
    assert.throws(
      () =>
        resolveConflict(before, {
          conflictId: before.conflicts[0]!.id,
          keepCommitmentId: external.commitment.id,
          endCommitmentId: stayora.id,
          reason: "Giữ ngoài",
          actor: ADMIN,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "STAY_IN_PROGRESS",
    );
    assert.equal(before.stays.find((item) => item.id === booked.stayId)?.status, "CHECKED_IN");
    assert.equal(before.bookings.find((item) => item.id === booked.bookingId)?.status, "CONFIRMED");
    assert.equal(before.commitments.find((item) => item.id === stayora.id)?.status, "ACTIVE");
    assert.equal(before.conflicts[0]?.status, "OPEN");
    assertConflictsRecorded(before);
  });

  it("3-way conflict: ending one while two still overlap → STILL_OVERLAPPING, conflict OPEN", () => {
    const booked = bookedStay();
    const first = recordExternalBooking(booked.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Airbnb",
      actor: HOST,
    });
    const second = recordExternalBooking(first.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Zalo",
      actor: HOST,
    });
    const stayora = second.world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.status === "ACTIVE",
    )!;
    assert.throws(
      () =>
        resolveConflict(second.world, {
          conflictId: second.world.conflicts[0]!.id,
          keepCommitmentId: stayora.id,
          endCommitmentId: first.commitment.id,
          reason: "Bỏ Airbnb",
          actor: ADMIN,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "STILL_OVERLAPPING",
    );
    assert.equal(second.world.conflicts[0]?.status, "OPEN");
    assert.equal(second.world.commitments.find((item) => item.id === first.commitment.id)?.status, "ACTIVE");
    assertConflictsRecorded(second.world);
  });

  it("Commission VOID never becomes EARNED", () => {
    const booked = bookedStay(SALE);
    const external = recordExternalBooking(booked.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Khách quen",
      actor: HOST,
    });
    const stayora = external.world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.status === "ACTIVE",
    )!;
    const resolved = resolveConflict(external.world, {
      conflictId: external.world.conflicts[0]!.id,
      keepCommitmentId: external.commitment.id,
      endCommitmentId: stayora.id,
      reason: "Giữ ngoài",
      actor: ADMIN,
    });
    assert.equal(resolved.world.commissions[0]?.status, "VOID");
    assert.throws(
      () => checkInStay(resolved.world, { stayId: booked.stayId, actor: BUTLER }),
      (error: unknown) => error instanceof DomainError,
    );
    assert.throws(
      () => checkOutStay(resolved.world, { stayId: booked.stayId, actor: BUTLER }),
      (error: unknown) => error instanceof DomainError,
    );
    assert.equal(resolved.world.commissions[0]?.status, "VOID");
    assertNoOverlap(resolved.world);
  });

  it("every mutating function appends exactly one audit entry", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "sao-bien",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = created.world;
    assert.equal(world.auditLog.length, 1);
    assert.equal(world.auditLog[0]?.action, "CREATE_REQUEST");

    const other = createRequest(world, {
      villaId: "gio-bien",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = other.world;
    assert.equal(world.auditLog.length, 2);

    world = acceptRequest(world, { requestId: created.request.id, actor: HOST }).world;
    assert.equal(world.auditLog.length, 3);
    world = rejectRequest(world, { requestId: other.request.id, actor: HOST }).world;
    assert.equal(world.auditLog.length, 4);
    world = pay(world, created.request.id).world;
    assert.equal(world.auditLog.length, 5);
    world = pay(world, created.request.id).world;
    assert.equal(world.auditLog.length, 6);
    world = markRefundDone(world, {
      refundId: world.refundCases[0]!.id,
      note: "Đã chuyển khoản",
      actor: ADMIN,
    }).world;
    assert.equal(world.auditLog.length, 7);

    const stayId = world.bookings[0]!.stayId;
    world = checkInStay(world, { stayId, actor: BUTLER }).world;
    assert.equal(world.auditLog.length, 8);
    world = reportIncident(world, {
      stayId,
      actor: BUTLER,
      note: "Ổn",
      hasPhoto: false,
    }).world;
    assert.equal(world.auditLog.length, 9);
    world = checkOutStay(world, { stayId, actor: BUTLER }).world;
    assert.equal(world.auditLog.length, 10);

    const unknownReq = createRequest(world, {
      villaId: "cat-vang",
      checkIn: "2026-12-20",
      checkOut: "2026-12-22",
      guests: 2,
      guestName: "Lan",
      actor: GUEST,
    });
    world = unknownReq.world;
    assert.equal(world.auditLog.length, 11);
    world = acceptRequest(world, { requestId: unknownReq.request.id, actor: HOST }).world;
    assert.equal(world.auditLog.length, 12);
    const unknown = pay(world, unknownReq.request.id, "UNKNOWN");
    world = unknown.world;
    assert.equal(world.auditLog.length, 13);
    world = resolveUnknown(world, {
      attemptId: unknown.attempt.id,
      outcome: "FAILED",
      actor: ADMIN,
    }).world;
    assert.equal(world.auditLog.length, 14);

    const noShow = createRequest(world, {
      villaId: "gio-bien",
      checkIn: "2026-12-20",
      checkOut: "2026-12-22",
      guests: 2,
      guestName: "Tuấn",
      actor: GUEST,
    });
    world = noShow.world;
    world = acceptRequest(world, { requestId: noShow.request.id, actor: HOST }).world;
    world = pay(world, noShow.request.id).world;
    const beforeNoShow = world.auditLog.length;
    world = markDidNotOccur(world, {
      stayId: world.bookings.find((item) => item.requestId === noShow.request.id)!.stayId,
      actor: BUTLER,
      reason: "Không đến",
    }).world;
    assert.equal(world.auditLog.length, beforeNoShow + 1);

    const blocked = createBlock(world, {
      villaId: "sen-hong",
      start: "2026-12-20",
      end: "2026-12-22",
      blockKind: "MAINTENANCE",
      actor: HOST,
    });
    world = blocked.world;
    const afterBlock = world.auditLog.length;
    world = releaseBlock(world, { commitmentId: blocked.commitment.id, actor: HOST }).world;
    assert.equal(world.auditLog.length, afterBlock + 1);

    const external = recordExternalBooking(world, {
      villaId: "minh-dam",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 4,
      source: "Khác",
      actor: HOST,
    });
    world = external.world;
    assert.equal(world.auditLog.length, afterBlock + 2);

    const booked = bookedStay();
    const clash = recordExternalBooking(booked.world, {
      villaId: "sao-bien",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Airbnb",
      actor: HOST,
    });
    const before = clash.world.auditLog.length;
    const stayora = clash.world.commitments.find(
      (item) => item.bookingId === booked.bookingId,
    )!;
    const resolved = resolveConflict(clash.world, {
      conflictId: clash.world.conflicts[0]!.id,
      keepCommitmentId: clash.commitment.id,
      endCommitmentId: stayora.id,
      reason: "Giữ ngoài",
      actor: ADMIN,
    });
    assert.equal(resolved.world.auditLog.length, before + 1);
    assertNoOverlap(world);
    assertNoOverlap(resolved.world);
  });

  it("BQL/Butler/Sale calling any Phase 2 function → FORBIDDEN", () => {
    const booked = bookedStay();
    const actors: Actor[] = [BQL, BUTLER, SALE];
    for (const actor of actors) {
      assert.throws(
        () =>
          recordExternalBooking(booked.world, {
            villaId: "sen-hong",
            checkIn: "2026-12-20",
            checkOut: "2026-12-22",
            guests: 2,
            source: "Airbnb",
            actor,
          }),
        (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
      );
      assert.throws(
        () =>
          createBlock(booked.world, {
            villaId: "sen-hong",
            start: "2026-12-20",
            end: "2026-12-22",
            blockKind: "OWNER",
            actor,
          }),
        (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
      );
      const block = booked.world.commitments.find((item) => item.kind === "AVAILABILITY_BLOCK");
      if (block) {
        assert.throws(
          () => releaseBlock(booked.world, { commitmentId: block.id, actor }),
          (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
        );
      }
      assert.throws(
        () =>
          recordPayment(booked.world, {
            obligationId: initialOf(booked.world, booked.requestId).id,
            outcome: "FAILED",
            actor,
          }),
        (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
      );
      assert.throws(
        () =>
          resolveConflict(booked.world, {
            conflictId: "missing",
            keepCommitmentId: "a",
            endCommitmentId: "b",
            reason: "x",
            actor,
          }),
        (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
      );
      assert.throws(
        () => markRefundDone(booked.world, { refundId: "missing", note: "x", actor }),
        (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
      );
    }
    assertNoOverlap(booked.world);
  });
});

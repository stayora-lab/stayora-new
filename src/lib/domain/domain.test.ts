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
  createEmptyWorld,
  createRequest,
  DomainError,
  isAvailable,
  markDidNotOccur,
  opsLists,
  recordPayment,
  rejectRequest,
  reportIncident,
  resolveUnknown,
} from "./engine.ts";
import { seedWorld } from "./seed.ts";
import type { Actor, PaymentOutcome, World } from "./types.ts";

const HOST: Actor = { persona: "HOST" };
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

function initialOf(world: World, requestId: string) {
  const obligation = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "INITIAL",
  );
  assert.ok(obligation, "missing INITIAL obligation");
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
    actor: HOST,
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
      actor: HOST,
    });
    world = resolved.world;
    assert.equal(world.bookings.length, 1);
    assert.ok(resolved.booking);
    assertNoOverlap(world);
  });

  it("advance time 31 min → Request EXPIRED, villa available; SUCCEEDED afterwards → error HOLD_EXPIRED, no Booking", () => {
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
    const hold = world.commitments.find((item) => item.kind === "HOLD");
    assert.equal(hold?.status, "ENDED");
    assert.equal(hold?.endedReason, "EXPIRED");
    assert.throws(
      () => pay(world, created.request.id, "SUCCEEDED"),
      (error: unknown) => error instanceof DomainError && error.code === "HOLD_EXPIRED",
    );
    assert.equal(world.bookings.length, 0);
    assertNoOverlap(world);
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

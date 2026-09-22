import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BUTLER_LINH, SALE_MAI } from "./catalog.ts";
import {
  acceptRequest,
  checkInStay,
  checkOutStay,
  confirmRequest,
  createEmptyWorld,
  createRequest,
  DomainError,
  isAvailable,
  markDidNotOccur,
  opsLists,
  reportIncident,
} from "./engine.ts";
import { seedWorld } from "./seed.ts";
import type { Actor, World } from "./types.ts";

const HOST: Actor = { persona: "HOST" };
const GUEST: Actor = { persona: "GUEST" };
const SALE: Actor = { persona: "SALE", saleId: SALE_MAI };
const BUTLER: Actor = { persona: "BUTLER", butlerId: BUTLER_LINH };
const BQL: Actor = { persona: "BQL" };

function shape(world: World, requestId: string) {
  const request = world.requests.find((item) => item.id === requestId)!;
  const booking = world.bookings.find((item) => item.requestId === requestId)!;
  const stay = world.stays.find((item) => item.id === request.stayId)!;
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
    paymentRule: booking.paymentRule,
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
  let world = createEmptyWorld("2026-09-22T03:00:00.000Z");
  const created = createRequest(world, {
    villaId: "sao-bien",
    checkIn: "2026-12-01",
    checkOut: "2026-12-04",
    guests: 4,
    guestName: "Mai",
    actor,
  });
  world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
  world = confirmRequest(world, { requestId: created.request.id, actor: HOST }).world;
  return { world, requestId: created.request.id, stayId: world.requests[0]!.stayId!, bookingId: world.requests[0]!.bookingId! };
}

describe("Sale request converges with a direct Guest request", () => {
  it("produces the same Booking and Stay shape after Host accept + confirm", () => {
    let guestWorld = createEmptyWorld("2026-09-22T03:00:00.000Z");
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
    guestWorld = confirmRequest(guestWorld, {
      requestId: guestCreated.request.id,
      actor: HOST,
    }).world;

    let saleWorld = createEmptyWorld("2026-09-22T03:00:00.000Z");
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
    saleWorld = confirmRequest(saleWorld, {
      requestId: saleCreated.request.id,
      actor: HOST,
    }).world;

    assert.deepEqual(
      shape(guestWorld, guestCreated.request.id),
      shape(saleWorld, saleCreated.request.id),
    );
    assert.equal(guestWorld.requests[0]?.source, "GUEST");
    assert.equal(saleWorld.requests[0]?.source, "SALE");
    assert.equal(saleWorld.requests[0]?.saleId, SALE_MAI);
    assert.equal(guestWorld.commissions.length, 0);
    assert.equal(saleWorld.commissions.length, 1);
  });
});

describe("Sale commission", () => {
  it("is 10% of accommodation total, only on bookings with that saleId, and stays Chờ until COMPLETED", () => {
    let world = createEmptyWorld("2026-09-22T03:00:00.000Z");
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
    world = confirmRequest(world, { requestId: saleStay.request.id, actor: HOST }).world;
    world = acceptRequest(world, { requestId: guestStay.request.id, actor: HOST }).world;
    world = confirmRequest(world, { requestId: guestStay.request.id, actor: HOST }).world;

    const saleCommission = world.commissions.filter((item) => item.saleId === SALE_MAI);
    assert.equal(saleCommission.length, 1);
    assert.equal(saleCommission[0]?.amount, Math.round(saleStay.request.total * 0.1));
    assert.equal(saleCommission[0]?.status, "PENDING");
    assert.equal(
      world.commissions.some((item) => item.bookingId === world.bookings.find((b) => b.requestId === guestStay.request.id)?.id),
      false,
    );

    const stayId = world.requests.find((item) => item.id === saleStay.request.id)?.stayId;
    assert.ok(stayId);
    world = checkInStay(world, { stayId, actor: BUTLER }).world;
    world = checkOutStay(world, { stayId, actor: BUTLER }).world;
    assert.equal(world.commissions.find((item) => item.stayId === stayId)?.status, "EARNED");
    assert.equal(world.stays.find((item) => item.id === stayId)?.status, "COMPLETED");
  });
});

describe("Stay transitions", () => {
  it("refuses DID_NOT_OCCUR from CHECKED_IN", () => {
    const booked = bookedStay();
    let world = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    assert.throws(
      () => markDidNotOccur(world, { stayId: booked.stayId, actor: BUTLER, reason: "Khách báo hủy trễ" }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
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
    assert.equal(commitment.kind, "CONFIRMED_ACCOMMODATION");
    assert.equal(isAvailable(world, "sao-bien", "2026-12-01", "2026-12-04"), false);
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
    assert.equal(isAvailable(world, "sao-bien", "2026-12-01", "2026-12-04"), false);
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
  });

  it("Sale cannot accept a request", () => {
    const created = createRequest(createEmptyWorld("2026-09-22T03:00:00.000Z"), {
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
  });
});

describe("Butler today board", () => {
  it("groups seed stays for 22/9 without treating external as second-class", () => {
    const lists = opsLists(seedWorld(), "2026-09-22");
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
    assert.equal(lists.inHouse[0]?.originLabel, "Oceanami trực tiếp");
    assert.equal(lists.inHouse[0]?.guestName, "Gia đình Trần");
  });
});

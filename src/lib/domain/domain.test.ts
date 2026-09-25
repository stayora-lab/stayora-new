import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BUTLER_LINH, paymentPlan, SALE_MAI } from "./catalog.ts";
import { ACCEPTANCE_RESPONSE_MS, HOLD_MS, HOST_RESPONSE_MS, NEAR_CHECK_IN_RESPONSE_MS } from "./config.ts";
import { overlappingActive } from "./availability.ts";
import {
  acceptRequest,
  advanceTime,
  checkInStay,
  checkOutStay,
  evaluateStayCompletion,
  observeArrival,
  observeDeparture,
  placeProtectiveHold,
  recordMaintenanceFromHold,
  releaseProtectiveHold,
  reportPrepared,
  competingAccepted,
  createBlock,
  createEmptyWorld,
  createRequest,
  DomainError,
  extendAcceptanceDeadline,
  hostResponseDueAt,
  isAvailable,
  markDidNotOccur,
  markRefundDone,
  opsLists,
  recordExternalBooking,
  recordExternalFact,
  establishExternalCommitment,
  submitExternalReport,
  recordPayment,
  rejectRequest,
  releaseBlock,
  reportIncident,
  resolveConflict,
  resolveUnknown,
} from "./engine.ts";
import { seedWorld } from "./seed.ts";
import { planRoleGrants } from "../grant-scope.ts";
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
    villaId: "t01",
    checkIn: "2026-12-01",
    checkOut: "2026-12-04",
    guests: 4,
    guestName: "Mai",
    actor,
  });
  world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    guestWorld = acceptRequest(guestCreated.world, { handling: "EXCLUSIVE",
      requestId: guestCreated.request.id,
      actor: HOST,
    }).world;
    guestWorld = pay(guestWorld, guestCreated.request.id).world;

    let saleWorld = createEmptyWorld(NOW);
    const saleCreated = createRequest(saleWorld, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: SALE,
    });
    saleWorld = acceptRequest(saleCreated.world, { handling: "EXCLUSIVE",
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
      villaId: "t01",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 4,
      guestName: "Gia Phạm",
      actor: SALE,
    });
    world = saleStay.world;
    const guestStay = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      guestName: "Linh",
      actor: GUEST,
    });
    world = guestStay.world;

    world = acceptRequest(world, { handling: "EXCLUSIVE", requestId: saleStay.request.id, actor: HOST }).world;
    world = pay(world, saleStay.request.id).world;
    world = acceptRequest(world, { handling: "EXCLUSIVE", requestId: guestStay.request.id, actor: HOST }).world;
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
    assert.equal(world.stays.find((item) => item.id === stayId)?.status, "CHECKED_OUT");
    assert.equal(world.commissions.find((item) => item.stayId === stayId)?.status, "PENDING");
    world = evaluateStayCompletion(world, { stayId, actor: BUTLER }).world;
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
      () => markDidNotOccur(world, { stayId: booked.stayId, actor: BUTLER, reason: "NO_SHOW" }),
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
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "CHECKED_OUT");
    world = evaluateStayCompletion(world, { stayId: booked.stayId, actor: BUTLER }).world;
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "COMPLETED");
    const commitment = world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.kind === "CONFIRMED_ACCOMMODATION",
    );
    assert.ok(commitment);
    assert.equal(commitment.status, "ACTIVE");
    assert.equal(isAvailable(world, "t01", "2026-12-01", "2026-12-04"), false);
    assertNoOverlap(world);
  });

  it("DID_NOT_OCCUR does not release inventory", () => {
    const booked = bookedStay();
    const world = markDidNotOccur(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      reason: "NO_SHOW",
    }).world;
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "DID_NOT_OCCUR");
    const commitment = world.commitments.find(
      (item) => item.bookingId === booked.bookingId && item.kind === "CONFIRMED_ACCOMMODATION",
    );
    assert.ok(commitment);
    assert.equal(commitment.status, "ACTIVE");
    assert.equal(isAvailable(world, "t01", "2026-12-01", "2026-12-04"), false);
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
});

describe("arrival observation is not check-in", () => {
  it("observing arrival leaves the stay scheduled and does not check in", () => {
    const booked = bookedStay();
    const noted = observeArrival(booked.world, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(noted.stay.status, "SCHEDULED");
    assert.ok(noted.stay.arrivalObservedAt);
    assert.equal(noted.stay.checkedInAt, undefined);
    assert.equal(noted.world.auditLog[0]?.action, "OBSERVE_ARRIVAL");
    const commitment = noted.world.commitments.find((item) => item.bookingId === booked.bookingId);
    assert.equal(commitment?.status, "ACTIVE");
    assert.equal(isAvailable(noted.world, "t01", "2026-12-01", "2026-12-04"), false);
    assertNoOverlap(noted.world);
  });

  it("check-in does not record an arrival observation", () => {
    const booked = bookedStay();
    const checked = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(checked.stay.status, "CHECKED_IN");
    assert.equal(checked.stay.arrivalObservedAt, undefined);
    assert.ok(checked.stay.checkedInAt);
    assertNoOverlap(checked.world);
  });

  it("arrival can be noted after check-in without changing the stay", () => {
    const booked = bookedStay();
    const checked = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    const noted = observeArrival(checked, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(noted.stay.status, "CHECKED_IN");
    assert.ok(noted.stay.arrivalObservedAt);
    assert.equal(noted.stay.checkedInAt, checked.stays.find((item) => item.id === booked.stayId)?.checkedInAt);
    assertNoOverlap(noted.world);
  });
});

describe("departure observation is not checkout", () => {
  it("observing departure leaves the guest checked in and does not check out", () => {
    const booked = bookedStay();
    const checked = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    const noted = observeDeparture(checked, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(noted.stay.status, "CHECKED_IN");
    assert.ok(noted.stay.departureObservedAt);
    assert.equal(noted.stay.checkedOutAt, undefined);
    assert.equal(noted.stay.completedAt, undefined);
    assert.equal(noted.world.auditLog[0]?.action, "OBSERVE_DEPARTURE");
    const commitment = noted.world.commitments.find((item) => item.bookingId === booked.bookingId);
    assert.equal(commitment?.status, "ACTIVE");
    assertNoOverlap(noted.world);
  });

  it("checkout does not record a departure observation", () => {
    const booked = bookedStay();
    const checked = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    const left = checkOutStay(checked, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(left.stay.status, "CHECKED_OUT");
    assert.equal(left.stay.departureObservedAt, undefined);
    assert.ok(left.stay.checkedOutAt);
    assert.equal(left.stay.completedAt, undefined);
    assertNoOverlap(left.world);
  });

  it("departure can be noted without ever checking in", () => {
    const booked = bookedStay();
    const noted = observeDeparture(booked.world, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(noted.stay.status, "SCHEDULED");
    assert.ok(noted.stay.departureObservedAt);
    assert.equal(noted.stay.checkedOutAt, undefined);
    assertNoOverlap(noted.world);
  });
});

describe("checkout is not completion", () => {
  it("checkout records CHECKED_OUT and leaves completion for a later evaluation", () => {
    const booked = bookedStay();
    const checked = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    const left = checkOutStay(checked, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(left.stay.status, "CHECKED_OUT");
    assert.ok(left.stay.checkedOutAt);
    assert.equal(left.stay.completedAt, undefined);
    assert.equal(left.world.commissions.find((item) => item.stayId === booked.stayId)?.status, undefined);
    assert.equal(left.world.auditLog[0]?.action, "CHECK_OUT");
    const commitment = left.world.commitments.find((item) => item.bookingId === booked.bookingId);
    assert.equal(commitment?.status, "ACTIVE");
    const done = evaluateStayCompletion(left.world, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(done.stay.status, "COMPLETED");
    assert.equal(done.stay.checkedOutAt, left.stay.checkedOutAt);
    assert.ok(done.stay.completedAt);
    assert.equal(done.world.auditLog[0]?.action, "COMPLETE");
    assert.equal(
      done.world.commitments.find((item) => item.bookingId === booked.bookingId)?.status,
      "ACTIVE",
    );
    assert.equal(isAvailable(done.world, "t01", "2026-12-01", "2026-12-04"), false);
    assertNoOverlap(done.world);
  });

  it("an open incident does not block completion and does not change checkout", () => {
    const booked = bookedStay();
    let world = checkInStay(booked.world, { stayId: booked.stayId, actor: BUTLER }).world;
    world = reportIncident(world, {
      stayId: booked.stayId,
      actor: BUTLER,
      note: "Vòi nước rỉ",
      hasPhoto: false,
    }).world;
    world = checkOutStay(world, { stayId: booked.stayId, actor: BUTLER }).world;
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "CHECKED_OUT");
    world = evaluateStayCompletion(world, { stayId: booked.stayId, actor: BUTLER }).world;
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "COMPLETED");
    assert.equal(world.incidents.length, 1);
    assertNoOverlap(world);
  });
});

describe("assignment is not authority", () => {
  it("a Butler cannot prepare, observe, check in, or check out a villa they are not assigned to", () => {
    const booked = bookedStay();
    const world: World = {
      ...booked.world,
      butlers: [
        ...booked.world.butlers,
        { id: "butler-dung", name: "Quản gia Dung", villaIds: ["t12"] },
      ],
    };
    const dung: Actor = { persona: "BUTLER", butlerId: "butler-dung" };
    const refused = (run: () => unknown) =>
      assert.throws(
        run,
        (error: unknown) => error instanceof DomainError && error.code === "NOT_ASSIGNED",
      );
    refused(() => reportPrepared(world, { stayId: booked.stayId, actor: dung }));
    refused(() => observeArrival(world, { stayId: booked.stayId, actor: dung }));
    refused(() => observeDeparture(world, { stayId: booked.stayId, actor: dung }));
    refused(() => checkInStay(world, { stayId: booked.stayId, actor: dung }));
    const checked = checkInStay(world, { stayId: booked.stayId, actor: BUTLER }).world;
    refused(() => checkOutStay(checked, { stayId: booked.stayId, actor: dung }));
    const left = checkOutStay(checked, { stayId: booked.stayId, actor: BUTLER }).world;
    refused(() => evaluateStayCompletion(left, { stayId: booked.stayId, actor: dung }));
    assert.equal(world.stays.find((item) => item.id === booked.stayId)?.status, "SCHEDULED");
    assertNoOverlap(world);
  });

  it("a butler granted one villa per grant can act on each of those villas", () => {
    const known = ["t01", "t06", "t12"];
    assert.throws(
      () => planRoleGrants({ role: "BUTLER", villaIds: [], knownVillaIds: known, accountId: "usr_lan" }),
      /ít nhất một villa/,
    );
    assert.throws(
      () =>
        planRoleGrants({
          role: "BUTLER",
          villaIds: ["T01-T06"],
          knownVillaIds: known,
          accountId: "usr_lan",
        }),
      /không có trong danh sách/,
    );
    const planned = planRoleGrants({
      role: "BUTLER",
      villaIds: ["t01", "t06"],
      knownVillaIds: known,
      accountId: "usr_lan",
    });
    assert.deepEqual(
      planned.map((item) => item.scopeRef),
      ["t01", "t06"],
    );
    const actor: Actor = {
      persona: "BUTLER",
      butlerId: "usr_lan",
      assignedVillaIds: planned.map((item) => item.scopeRef!),
    };
    const first = bookedStay();
    const prepared = reportPrepared(first.world, { stayId: first.stayId, actor });
    assert.ok(prepared.world.stays.find((item) => item.id === first.stayId)?.preparedAt);

    let second = createEmptyWorld(NOW);
    const created = createRequest(second, {
      villaId: "t06",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    second = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
    const paid = pay(second, created.request.id);
    const onSecond = reportPrepared(paid.world, { stayId: paid.stay!.id, actor });
    assert.ok(onSecond.world.stays.find((item) => item.id === paid.stay!.id)?.preparedAt);

    let other = createEmptyWorld(NOW);
    const otherRequest = createRequest(other, {
      villaId: "t12",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    other = acceptRequest(otherRequest.world, { handling: "EXCLUSIVE", requestId: otherRequest.request.id, actor: HOST }).world;
    const otherPaid = pay(other, otherRequest.request.id);
    assert.throws(
      () => reportPrepared(otherPaid.world, { stayId: otherPaid.stay!.id, actor }),
      (error: unknown) => error instanceof DomainError && error.code === "NOT_ASSIGNED",
    );
  });
});

describe("Stay transitions", () => {
  it("Sale cannot accept a request", () => {
    const created = createRequest(createEmptyWorld(NOW), {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 2,
      guestName: "An",
      actor: SALE,
    });
    assert.throws(
      () => acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: SALE }),
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
      ["t03", "t05"],
    );
    assert.deepEqual(
      lists.departing.map((stay) => stay.villaId),
      ["t01"],
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = first.world;
    const second = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = second.world;
    assert.equal(isAvailable(world, "t04", "2026-12-01", "2026-12-04"), true);
    assert.equal(world.requests.filter((item) => item.status === "PENDING").length, 2);
    assertNoOverlap(world);
  });

  it("competitive accept of two overlapping requests → both ACCEPTED, no hold", () => {
    let world = createEmptyWorld(NOW);
    const first = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = first.world;
    const second = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = second.world;
    world = acceptRequest(world, { handling: "COMPETITIVE", requestId: first.request.id, actor: HOST }).world;
    world = acceptRequest(world, { handling: "COMPETITIVE", requestId: second.request.id, actor: HOST }).world;
    assert.equal(world.requests.find((item) => item.id === first.request.id)?.status, "ACCEPTED");
    assert.equal(world.requests.find((item) => item.id === second.request.id)?.status, "ACCEPTED");
    assert.equal(
      world.commitments.filter((item) => item.kind === "HOLD" && item.status === "ACTIVE").length,
      0,
    );
    assert.equal(isAvailable(world, "t04", "2026-12-01", "2026-12-04"), true);
    assert.equal(world.bookings.length, 0);
    assertNoOverlap(world);
  });

  it("exclusive handling still reserves the dates and blocks a second exclusive accept", () => {
    let world = createEmptyWorld(NOW);
    const first = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = first.world;
    const second = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = second.world;
    world = acceptRequest(world, { handling: "EXCLUSIVE", requestId: first.request.id, actor: HOST }).world;
    world = acceptRequest(world, { handling: "EXCLUSIVE", requestId: second.request.id, actor: HOST }).world;
    assert.equal(world.requests.find((item) => item.id === first.request.id)?.status, "ACCEPTED");
    assert.equal(world.requests.find((item) => item.id === second.request.id)?.status, "CONFLICTED");
    assert.notEqual(world.requests.find((item) => item.id === second.request.id)?.status, "DECLINED");
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
    assert.throws(
      () => rejectRequest(world, { requestId: created.request.id, actor: HOST }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
    assertNoOverlap(world);
  });
});

describe("Payment confirmation", () => {
  it("exclusive handling: INITIAL SUCCEEDED → 1 Booking, HOLD ENDED/SUPERSEDED, ids all different", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
    world = advanceTime(world, 31 * 60 * 1000);
    assert.equal(world.requests.find((item) => item.id === created.request.id)?.status, "EXPIRED");
    assert.equal(isAvailable(world, "t04", "2026-12-01", "2026-12-04"), true);
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(first.world, { handling: "EXCLUSIVE", requestId: first.request.id, actor: HOST }).world;
    const unknown = pay(world, first.request.id, "UNKNOWN");
    world = unknown.world;
    world = advanceTime(world, 31 * 60 * 1000);
    assert.equal(isAvailable(world, "t04", "2026-12-01", "2026-12-04"), true);

    const second = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = acceptRequest(second.world, { handling: "EXCLUSIVE", requestId: second.request.id, actor: HOST }).world;
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
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

  it("BALANCE after Booking CANCELLED → attempt stored, RefundCase BOOKING_CANCELLED", () => {
    const booked = bookedStay();
    const external = recordExternalBooking(booked.world, {
      villaId: "t01",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
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
      reason: "Giữ ngoài",
      actor: ADMIN,
    });
    assert.equal(
      resolved.world.bookings.find((item) => item.id === booked.bookingId)?.status,
      "CANCELLED",
    );
    const beforeAttempts = resolved.world.attempts.length;
    const balance = balanceOf(resolved.world, booked.requestId);
    const paid = recordPayment(resolved.world, {
      obligationId: balance.id,
      outcome: "SUCCEEDED",
      actor: ADMIN,
    });
    assert.equal(paid.attempt.status, "SUCCEEDED");
    assert.equal(paid.world.attempts.length, beforeAttempts + 1);
    assert.equal(paid.world.attempts[0]?.id, paid.attempt.id);
    assert.equal(paid.refund?.reason, "BOOKING_CANCELLED");
    assert.equal(paid.refund?.status, "OPEN");
    assert.equal(paid.refund?.attemptId, paid.attempt.id);
    assert.equal(
      paid.world.bookings.find((item) => item.id === booked.bookingId)?.status,
      "CANCELLED",
    );
    assert.equal(paid.world.bookings.length, 1);
    assertNoOverlap(paid.world);
  });

  it("SUCCEEDED on INITIAL after hold ended by conflict → RefundCase INVENTORY_CONFLICT, 0 Bookings", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
    const hold = world.commitments.find((item) => item.kind === "HOLD" && item.status === "ACTIVE")!;
    const external = recordExternalBooking(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Zalo",
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
    const paid = pay(resolved.world, created.request.id, "SUCCEEDED");
    assert.equal(paid.attempt.status, "SUCCEEDED");
    assert.equal(paid.world.bookings.length, 0);
    assert.equal(paid.refund?.reason, "INVENTORY_CONFLICT");
    assert.equal(paid.refund?.status, "OPEN");
    assert.equal(paid.refund?.attemptId, paid.attempt.id);
    assert.notEqual(paid.refund?.reason, "HOLD_EXPIRED");
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
      villaId: "t04",
      checkIn: "2026-10-02",
      checkOut: "2026-10-05",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(farReq.world, { handling: "EXCLUSIVE", requestId: farReq.request.id, actor: HOST }).world;
    assert.equal(
      world.obligations.filter((item) => item.requestId === farReq.request.id).length,
      2,
    );

    world = createEmptyWorld("2026-09-22T12:00:00.000Z");
    const nearReq = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-09-23",
      checkOut: "2026-09-26",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(nearReq.world, { handling: "EXCLUSIVE", requestId: nearReq.request.id, actor: HOST }).world;
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
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
      villaId: "t04",
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
      villaId: "t01",
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
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
    const hold = world.commitments.find((item) => item.kind === "HOLD" && item.status === "ACTIVE");
    assert.ok(hold);
    const external = recordExternalBooking(world, {
      villaId: "t04",
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
          villaId: "t01",
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
      villaId: "t01",
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
      "SCHEDULED",
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

  it("end Stayora commitment → Booking CANCELLED, Stay still SCHEDULED, then DID_NOT_OCCUR is a separate step", () => {
    const booked = bookedStay(SALE);
    const external = recordExternalBooking(booked.world, {
      villaId: "t01",
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
    assert.equal(resolved.world.stays.find((item) => item.id === booked.stayId)?.status, "SCHEDULED");
    assert.notEqual(resolved.world.stays.find((item) => item.id === booked.stayId)?.status, "DID_NOT_OCCUR");
    assert.equal(resolved.world.commissions[0]?.status, "VOID");
    assert.equal(resolved.world.refundCases[0]?.reason, "CONFLICT_RESOLUTION");
    assert.equal(
      opsLists(resolved.world, "2026-12-01").arriving.some((stay) => stay.id === booked.stayId),
      true,
    );
    const marked = markDidNotOccur(resolved.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      reason: "BOOKING_CANCELLED",
    });
    assert.equal(marked.stay.status, "DID_NOT_OCCUR");
    assert.equal(marked.stay.didNotOccurReason, "BOOKING_CANCELLED");
    assert.equal(
      marked.world.bookings.find((item) => item.id === booked.bookingId)?.status,
      "CANCELLED",
    );
    const lists = opsLists(marked.world, "2026-12-01");
    assert.equal(
      lists.arriving.some((stay) => stay.id === booked.stayId),
      false,
    );
    assert.throws(
      () => checkInStay(marked.world, { stayId: booked.stayId, actor: BUTLER }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
    assertNoOverlap(marked.world);
  });

  it("end EXTERNAL commitment → its Stay stays SCHEDULED until a separate non-occurrence", () => {
    const booked = bookedStay();
    const external = recordExternalBooking(booked.world, {
      villaId: "t01",
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
    assert.equal(resolved.world.stays.find((item) => item.id === external.stay.id)?.status, "SCHEDULED");
    assert.equal(
      opsLists(resolved.world, "2026-12-01").arriving.some((stay) => stay.id === external.stay.id),
      true,
    );
    assert.equal(resolved.world.bookings.find((item) => item.id === booked.bookingId)?.status, "CONFIRMED");
    const marked = markDidNotOccur(resolved.world, {
      stayId: external.stay.id,
      actor: BUTLER,
      reason: "OTHER_AUTHORIZED_REASON",
    });
    assert.equal(marked.stay.status, "DID_NOT_OCCUR");
    assert.equal(marked.stay.didNotOccurReason, "OTHER_AUTHORIZED_REASON");
    assert.equal(
      opsLists(marked.world, "2026-12-01").arriving.some((stay) => stay.id === external.stay.id),
      false,
    );
    assert.equal(marked.world.bookings.find((item) => item.id === booked.bookingId)?.status, "CONFIRMED");
    assertNoOverlap(marked.world);
  });

  it("end HOLD → Request CONFLICTED", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
    const hold = world.commitments.find((item) => item.kind === "HOLD" && item.status === "ACTIVE")!;
    const external = recordExternalBooking(world, {
      villaId: "t04",
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
      villaId: "t01",
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
      villaId: "t01",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Airbnb",
      actor: HOST,
    });
    const second = recordExternalBooking(first.world, {
      villaId: "t01",
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
      villaId: "t01",
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
    const checked = checkInStay(resolved.world, { stayId: booked.stayId, actor: BUTLER });
    const left = checkOutStay(checked.world, { stayId: booked.stayId, actor: BUTLER });
    const done = evaluateStayCompletion(left.world, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(done.stay.status, "COMPLETED");
    assert.equal(done.world.commissions[0]?.status, "VOID");
    const marked = markDidNotOccur(resolved.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      reason: "BOOKING_CANCELLED",
    });
    assert.throws(
      () => checkInStay(marked.world, { stayId: booked.stayId, actor: BUTLER }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );
    assert.equal(marked.world.commissions[0]?.status, "VOID");
    assertNoOverlap(done.world);
    assertNoOverlap(marked.world);
  });

  it("every mutating function appends exactly one audit entry", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "t01",
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
      villaId: "t05",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    world = other.world;
    assert.equal(world.auditLog.length, 2);

    world = acceptRequest(world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST }).world;
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
      villaId: "t06",
      checkIn: "2026-12-20",
      checkOut: "2026-12-22",
      guests: 2,
      guestName: "Lan",
      actor: GUEST,
    });
    world = unknownReq.world;
    assert.equal(world.auditLog.length, 11);
    world = acceptRequest(world, { handling: "EXCLUSIVE", requestId: unknownReq.request.id, actor: HOST }).world;
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
      villaId: "t05",
      checkIn: "2026-12-20",
      checkOut: "2026-12-22",
      guests: 2,
      guestName: "Tuấn",
      actor: GUEST,
    });
    world = noShow.world;
    world = acceptRequest(world, { handling: "EXCLUSIVE", requestId: noShow.request.id, actor: HOST }).world;
    world = pay(world, noShow.request.id).world;
    const beforeNoShow = world.auditLog.length;
    world = markDidNotOccur(world, {
      stayId: world.bookings.find((item) => item.requestId === noShow.request.id)!.stayId,
      actor: BUTLER,
      reason: "NO_SHOW",
    }).world;
    assert.equal(world.auditLog.length, beforeNoShow + 1);

    const blocked = createBlock(world, {
      villaId: "t04",
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
      villaId: "t03",
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
      villaId: "t01",
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
            villaId: "t04",
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
            villaId: "t04",
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

describe("emergency protective hold is not a maintenance block", () => {
  it("placing a protective hold does not create a maintenance block", () => {
    const booked = bookedStay();
    const before = booked.world.commitments.length;
    const placed = placeProtectiveHold(booked.world, {
      villaId: "t01",
      start: "2026-12-01",
      end: "2026-12-04",
      note: "Máy lạnh kêu",
      actor: BQL,
    });
    assert.equal(placed.hold.status, "ACTIVE");
    assert.equal(
      placed.world.commitments.some((item) => item.blockKind === "MAINTENANCE"),
      false,
    );
    assert.equal(placed.world.commitments.length, before);
    assert.equal(placed.world.protectiveHolds[0]?.id, placed.hold.id);
    assert.notEqual(placed.hold.id, placed.world.commitments[0]?.id);
    assertNoOverlap(placed.world);
  });

  it("recording maintenance is a separate host action and is not the hold", () => {
    let world = createEmptyWorld(NOW);
    const placed = placeProtectiveHold(world, {
      villaId: "t02",
      start: "2026-12-10",
      end: "2026-12-12",
      note: "Xem mái",
      actor: HOST,
    });
    world = placed.world;
    assert.throws(
      () => recordMaintenanceFromHold(world, { holdId: placed.hold.id, actor: BQL }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    const maintained = recordMaintenanceFromHold(world, { holdId: placed.hold.id, actor: HOST });
    assert.equal(maintained.hold.status, "ENDED");
    assert.equal(maintained.hold.endedAs, "MAINTENANCE");
    assert.equal(maintained.commitment.kind, "AVAILABILITY_BLOCK");
    assert.equal(maintained.commitment.blockKind, "MAINTENANCE");
    assert.notEqual(maintained.hold.id, maintained.commitment.id);
    assert.equal(
      maintained.world.protectiveHolds.some((item) => item.status === "ACTIVE"),
      false,
    );
    assertNoOverlap(maintained.world);
  });
});

describe("emergency protective hold is not an inventory commitment", () => {
  it("a protective hold over a stay does not end the booking or open a conflict", () => {
    const booked = bookedStay();
    const beforeStay = booked.world.stays.find((item) => item.id === booked.stayId);
    const beforeBooking = booked.world.bookings.find((item) => item.id === booked.bookingId);
    const beforeCommitment = booked.world.commitments.find(
      (item) => item.bookingId === booked.bookingId,
    );
    const noted = reportIncident(booked.world, {
      stayId: booked.stayId,
      actor: HOST,
      note: "Mùi khét",
      hasPhoto: false,
    });
    assert.equal(noted.world.commitments, booked.world.commitments);
    assert.equal(noted.world.bookings, booked.world.bookings);
    assert.equal((noted.world.protectiveHolds ?? []).length, 0);
    const placed = placeProtectiveHold(noted.world, {
      villaId: "t01",
      start: "2026-12-01",
      end: "2026-12-04",
      note: "Mùi khét",
      incidentId: noted.world.incidents[0]?.id,
      actor: BQL,
    });
    const stay = placed.world.stays.find((item) => item.id === booked.stayId);
    const booking = placed.world.bookings.find((item) => item.id === booked.bookingId);
    const commitment = placed.world.commitments.find((item) => item.bookingId === booked.bookingId);
    assert.equal(stay?.status, beforeStay?.status);
    assert.equal(booking?.status, beforeBooking?.status);
    assert.equal(commitment?.status, "ACTIVE");
    assert.equal(commitment?.id, beforeCommitment?.id);
    assert.equal(placed.world.conflicts.length, booked.world.conflicts.length);
    assert.equal(isAvailable(placed.world, "t01", "2026-12-01", "2026-12-04"), false);
    assert.throws(
      () => placeProtectiveHold(placed.world, {
        villaId: "t01",
        start: "2026-12-01",
        end: "2026-12-02",
        note: "Không được",
        actor: BUTLER,
      }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    assertNoOverlap(placed.world);
  });

  it("a protective hold blocks a new stayora commitment without choosing a winner", () => {
    let world = createEmptyWorld(NOW);
    const placed = placeProtectiveHold(world, {
      villaId: "t04",
      start: "2026-12-01",
      end: "2026-12-04",
      note: "Đang xem",
      actor: BQL,
    });
    world = placed.world;
    const created = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    const accepted = acceptRequest(created.world, { handling: "EXCLUSIVE", requestId: created.request.id, actor: HOST });
    assert.equal(accepted.request.status, "CONFLICTED");
    assert.equal(
      accepted.world.commitments.some((item) => item.requestId === created.request.id),
      false,
    );
    assert.equal(accepted.world.bookings.length, 0);
    assert.equal(accepted.world.conflicts.length, 0);
    const occupied = placeProtectiveHold(bookedStay().world, {
      villaId: "t01",
      start: "2026-12-01",
      end: "2026-12-04",
      note: "Có khách",
      actor: HOST,
    });
    const bookingBefore = occupied.world.bookings.find((item) => item.status === "CONFIRMED");
    assert.throws(
      () => recordMaintenanceFromHold(occupied.world, { holdId: occupied.hold.id, actor: HOST }),
      (error: unknown) => error instanceof DomainError && error.code === "BOOKING_REMAINS",
    );
    assert.equal(
      occupied.world.bookings.find((item) => item.id === bookingBefore?.id)?.status,
      "CONFIRMED",
    );
    assert.equal(occupied.hold.status, "ACTIVE");
    const overdue = advanceTime(world, 25 * 60 * 60 * 1000);
    assert.equal(overdue.protectiveHolds[0]?.status, "ACTIVE");
    assert.ok(overdue.protectiveHolds[0]!.reviewDueAt <= overdue.now);
    assertNoOverlap(accepted.world);
    assertNoOverlap(occupied.world);
    assertNoOverlap(overdue);
  });
});

describe("External report, fact, and commitment", () => {
  it("a Sale or Butler report is not a Fact and does not hold the calendar", () => {
    let world = createEmptyWorld(NOW);
    const reported = submitExternalReport(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      source: "Zalo",
      guestName: "Hoa",
      note: "Khách quen của sale",
      actor: SALE,
    });
    world = reported.world;
    assert.equal(reported.report.factId, undefined);
    assert.equal(world.externalAccommodations.length, 0);
    assert.equal(world.stays.length, 0);
    assert.equal(world.commitments.length, 0);
    assert.equal(world.bookings.length, 0);
    assert.equal(isAvailable(world, "t04", "2026-12-10", "2026-12-13"), true);
    const fromButler = submitExternalReport(world, {
      villaId: "t01",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      source: "Airbnb",
      actor: BUTLER,
    });
    assert.equal(fromButler.world.externalAccommodations.length, 0);
    assert.throws(
      () =>
        submitExternalReport(world, {
          villaId: "t04",
          checkIn: "2026-12-10",
          checkOut: "2026-12-12",
          guests: 2,
          source: "Zalo",
          actor: HOST,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    assertNoOverlap(fromButler.world);
  });

  it("a Host can record a Fact while no External-backed Commitment exists", () => {
    const world = createEmptyWorld(NOW);
    const reported = submitExternalReport(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      source: "Zalo",
      actor: SALE,
    });
    const recorded = recordExternalFact(reported.world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      source: "Zalo",
      reportId: reported.report.id,
      actor: HOST,
    });
    assert.equal(recorded.fact.reportId, reported.report.id);
    assert.equal(recorded.fact.commitmentId, undefined);
    assert.equal(recorded.world.externalReports[0]?.factId, recorded.fact.id);
    assert.equal(recorded.world.stays.length, 0);
    assert.equal(recorded.world.commitments.length, 0);
    assert.equal(recorded.world.bookings.length, 0);
    assert.equal(isAvailable(recorded.world, "t04", "2026-12-10", "2026-12-13"), true);
    const direct = recordExternalFact(world, {
      villaId: "t05",
      checkIn: "2026-12-15",
      checkOut: "2026-12-17",
      guests: 3,
      source: "Khách quen",
      actor: HOST,
    });
    assert.equal(direct.fact.reportId, undefined);
    assert.equal(direct.fact.commitmentId, undefined);
    assert.equal(direct.world.bookings.length, 0);
    assert.throws(
      () =>
        recordExternalFact(world, {
          villaId: "t05",
          checkIn: "2026-12-15",
          checkOut: "2026-12-17",
          guests: 2,
          source: "Zalo",
          actor: SALE,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    assertNoOverlap(recorded.world);
    assertNoOverlap(direct.world);
  });

  it("establishing a commitment is a different truth from the Fact, and one action can write both without a Booking", () => {
    const world = createEmptyWorld(NOW);
    const recorded = recordExternalFact(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      source: "Airbnb",
      guestName: "Hoa",
      actor: HOST,
    });
    const held = establishExternalCommitment(recorded.world, {
      factId: recorded.fact.id,
      actor: HOST,
    });
    const fact = held.world.externalAccommodations.find((item) => item.id === recorded.fact.id);
    assert.ok(fact);
    assert.notEqual(fact.id, held.commitment.id);
    assert.equal(fact.commitmentId, held.commitment.id);
    assert.equal(held.commitment.externalId, fact.id);
    assert.equal(held.commitment.basis, "EXTERNAL");
    assert.equal(held.stay.origin, "EXTERNAL");
    assert.equal(held.world.bookings.length, 0);
    assert.equal(isAvailable(held.world, "t04", "2026-12-10", "2026-12-13"), false);
    const together = recordExternalBooking(world, {
      villaId: "t06",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      source: "Booking.com",
      actor: HOST,
    });
    const written = together.world.externalAccommodations[0];
    assert.ok(written);
    assert.notEqual(written.id, together.commitment.id);
    assert.equal(written.commitmentId, together.commitment.id);
    assert.equal(together.world.bookings.length, 0);
    assert.equal(together.world.obligations.length, 0);
    assertNoOverlap(held.world);
    assertNoOverlap(together.world);
  });

  it("refuses a prose reason and accepts only a non-occurrence reason", () => {
    const booked = bookedStay();
    assert.throws(
      () => markDidNotOccur(booked.world, { stayId: booked.stayId, actor: BUTLER, reason: "Khách bận" }),
      (error: unknown) => error instanceof DomainError && error.code === "MISSING_REASON",
    );
    const marked = markDidNotOccur(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      reason: "NO_SHOW",
    });
    assert.equal(marked.stay.status, "DID_NOT_OCCUR");
    assertNoOverlap(marked.world);
  });
});

describe("Parallel acceptance and the two request clocks", () => {
  function pair() {
    let world = createEmptyWorld(NOW);
    const first = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    const second = createRequest(first.world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Bình",
      actor: GUEST,
    });
    return { first, second };
  }

  it("the first verified payment confirms; the other accepted request is CONFLICTED, not DECLINED", () => {
    const { first, second } = pair();
    let world = acceptRequest(second.world, {
      handling: "COMPETITIVE",
      requestId: first.request.id,
      actor: HOST,
    }).world;
    world = acceptRequest(world, {
      handling: "COMPETITIVE",
      requestId: second.request.id,
      actor: HOST,
    }).world;
    const pending = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Cường",
      actor: GUEST,
    });
    world = pending.world;
    const paid = pay(world, first.request.id);
    world = paid.world;
    assert.equal(world.bookings.length, 1);
    assert.equal(world.commitments.filter((item) => item.kind === "HOLD").length, 0);
    assert.equal(world.requests.find((item) => item.id === second.request.id)?.status, "CONFLICTED");
    assert.notEqual(world.requests.find((item) => item.id === second.request.id)?.status, "DECLINED");
    assert.equal(world.requests.find((item) => item.id === pending.request.id)?.status, "PENDING");
    const late = pay(world, second.request.id);
    assert.equal(late.world.bookings.length, 1);
    assert.equal(late.refund?.reason, "INVENTORY_CONFLICT");
    assert.equal(late.refund?.status, "OPEN");
    assertNoOverlap(late.world);
  });

  it("UNKNOWN does not win, does not block the other request, and reconciles into a refund only if money arrived", () => {
    const { first, second } = pair();
    let world = acceptRequest(second.world, {
      handling: "COMPETITIVE",
      requestId: first.request.id,
      actor: HOST,
    }).world;
    world = acceptRequest(world, {
      handling: "COMPETITIVE",
      requestId: second.request.id,
      actor: HOST,
    }).world;
    const unknown = pay(world, first.request.id, "UNKNOWN");
    world = unknown.world;
    assert.equal(world.bookings.length, 0);
    assert.equal(world.requests.find((item) => item.id === second.request.id)?.status, "ACCEPTED");
    const winner = pay(world, second.request.id, "SUCCEEDED");
    world = winner.world;
    assert.equal(world.bookings.length, 1);
    assert.equal(world.requests.find((item) => item.id === first.request.id)?.status, "CONFLICTED");
    assert.equal(world.attempts.find((item) => item.id === unknown.attempt.id)?.status, "UNKNOWN");
    const resolved = resolveUnknown(world, {
      attemptId: unknown.attempt.id,
      outcome: "SUCCEEDED",
      actor: ADMIN,
    });
    assert.equal(resolved.world.bookings.length, 1);
    assert.equal(resolved.refund?.reason, "INVENTORY_CONFLICT");
    const failedCase = pair();
    let failedWorld = acceptRequest(failedCase.second.world, {
      handling: "COMPETITIVE",
      requestId: failedCase.first.request.id,
      actor: HOST,
    }).world;
    const unresolved = pay(failedWorld, failedCase.first.request.id, "UNKNOWN");
    const cleared = resolveUnknown(unresolved.world, {
      attemptId: unresolved.attempt.id,
      outcome: "FAILED",
      actor: ADMIN,
    });
    assert.equal(cleared.refund, undefined);
    assert.equal(cleared.world.bookings.length, 0);
    assert.equal(cleared.world.refundCases.length, 0);
    assertNoOverlap(resolved.world);
    assertNoOverlap(cleared.world);
  });

  it("competition is disclosed only from real overlapping acceptances, and the count is the same for both", () => {
    const { first, second } = pair();
    let world = acceptRequest(second.world, {
      handling: "COMPETITIVE",
      requestId: first.request.id,
      actor: HOST,
    }).world;
    assert.equal(competingAccepted(world, first.request.id).length, 0);
    world = acceptRequest(world, {
      handling: "COMPETITIVE",
      requestId: second.request.id,
      actor: HOST,
    }).world;
    assert.equal(competingAccepted(world, first.request.id).length, 1);
    assert.equal(competingAccepted(world, second.request.id).length, 1);
    assert.equal(competingAccepted(world, first.request.id)[0]?.id, second.request.id);
    assertNoOverlap(world);
  });

  it("a PENDING request expires on its own clock; an accepted request expires on a new clock", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "t05",
      checkIn: "2026-12-20",
      checkOut: "2026-12-23",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = created.world;
    const due = world.requests[0]?.responseDueAt;
    assert.equal(due, new Date(Date.parse(NOW) + HOST_RESPONSE_MS).toISOString());
    world = advanceTime(world, HOST_RESPONSE_MS);
    assert.equal(world.requests[0]?.status, "EXPIRED");
    assert.throws(
      () => acceptRequest(world, { handling: "COMPETITIVE", requestId: created.request.id, actor: HOST }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID_TRANSITION",
    );

    world = createEmptyWorld(NOW);
    const accepted = createRequest(world, {
      villaId: "t05",
      checkIn: "2026-12-20",
      checkOut: "2026-12-23",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    world = acceptRequest(accepted.world, {
      handling: "COMPETITIVE",
      requestId: accepted.request.id,
      actor: HOST,
    }).world;
    world = advanceTime(world, ACCEPTANCE_RESPONSE_MS);
    assert.equal(world.requests.find((item) => item.id === accepted.request.id)?.status, "EXPIRED");
    const late = pay(world, accepted.request.id);
    assert.equal(late.world.bookings.length, 0);
    assert.equal(late.refund?.reason, "HOLD_EXPIRED");
    assertNoOverlap(late.world);
  });

  it("a Request left PENDING survives the accepted request's own expiry", () => {
    const { first, second } = pair();
    let world = acceptRequest(second.world, {
      handling: "COMPETITIVE",
      requestId: first.request.id,
      actor: HOST,
    }).world;
    world = advanceTime(world, ACCEPTANCE_RESPONSE_MS);
    assert.equal(world.requests.find((item) => item.id === first.request.id)?.status, "EXPIRED");
    assert.equal(world.requests.find((item) => item.id === second.request.id)?.status, "PENDING");
    world = acceptRequest(world, {
      handling: "EXCLUSIVE",
      requestId: second.request.id,
      actor: HOST,
    }).world;
    assert.equal(world.requests.find((item) => item.id === second.request.id)?.status, "ACCEPTED");
    assert.equal(
      world.commitments.filter((item) => item.kind === "HOLD" && item.status === "ACTIVE").length,
      1,
    );
    assertNoOverlap(world);
  });

  it("the Host-response deadline shortens near Check-in and never passes Check-in", () => {
    const far = hostResponseDueAt(NOW, "2026-12-20");
    assert.equal(far, new Date(Date.parse(NOW) + HOST_RESPONSE_MS).toISOString());
    const near = hostResponseDueAt("2026-12-01T03:00:00.000Z", "2026-12-01");
    const checkIn = Date.parse("2026-12-01T07:00:00.000Z");
    assert.ok(near);
    assert.ok(Date.parse(near) <= checkIn);
    assert.equal(near, new Date(Date.parse("2026-12-01T03:00:00.000Z") + NEAR_CHECK_IN_RESPONSE_MS).toISOString());
    const tight = hostResponseDueAt("2026-12-01T06:30:00.000Z", "2026-12-01");
    assert.ok(tight);
    assert.equal(tight, new Date(checkIn).toISOString());
    assert.ok(Date.parse(tight) <= checkIn);
  });

  it("the Host may extend an acceptance deadline and may not shorten it", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "t04",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "An",
      actor: GUEST,
    });
    const accepted = acceptRequest(created.world, {
      handling: "COMPETITIVE",
      requestId: created.request.id,
      actor: HOST,
    });
    world = accepted.world;
    const current = accepted.request.confirmDueAt!;
    assert.throws(
      () =>
        extendAcceptanceDeadline(world, {
          requestId: created.request.id,
          actor: HOST,
          until: new Date(Date.parse(current) - 60_000).toISOString(),
        }),
      (error: unknown) => error instanceof DomainError && error.code === "INVALID",
    );
    const extended = extendAcceptanceDeadline(world, { requestId: created.request.id, actor: HOST });
    assert.ok(Date.parse(extended.request.confirmDueAt!) > Date.parse(current));
    assertNoOverlap(extended.world);
  });

  it("competitive handling cannot override someone else's exclusive hold", () => {
    const { first, second } = pair();
    let world = acceptRequest(second.world, {
      handling: "EXCLUSIVE",
      requestId: first.request.id,
      actor: HOST,
    }).world;
    const competed = acceptRequest(world, {
      handling: "COMPETITIVE",
      requestId: second.request.id,
      actor: HOST,
    });
    assert.equal(competed.request.status, "CONFLICTED");
    assert.equal(
      competed.world.commitments.filter((item) => item.kind === "HOLD" && item.status === "ACTIVE").length,
      1,
    );
    assertNoOverlap(competed.world);
  });
});

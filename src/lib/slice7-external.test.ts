import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { drawerAction } from "./butler-board-view.ts";
import { BUTLER_LINH } from "./domain/catalog.ts";
import {
  acceptRequest,
  beginCleaning,
  checkInStay,
  checkoutWithAssessment,
  completeCleaning,
  createEmptyWorld,
  createRequest,
  DomainError,
  isAvailable,
  observeArrival,
  observeDeparture,
  readinessOf,
  recordExternalBooking,
  recordExternalFact,
  recordPayment,
} from "./domain/engine.ts";
import type { Actor, World } from "./domain/types.ts";

const NOW = "2026-09-22T03:00:00.000Z";
const HOST: Actor = { persona: "HOST" };
const ADMIN: Actor = { persona: "ADMIN" };
const GUEST: Actor = { persona: "GUEST" };
const BUTLER: Actor = { persona: "BUTLER", butlerId: BUTLER_LINH };
const SALE: Actor = { persona: "SALE", saleId: "sale-an" };

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function moneyCount(world: World) {
  return {
    bookings: world.bookings.length,
    obligations: world.obligations.length,
    attempts: world.attempts.length,
    commissions: world.commissions.length,
    refunds: world.refundCases.length,
  };
}

function stayoraStay() {
  const created = createRequest(createEmptyWorld(NOW), {
    villaId: "t01",
    checkIn: "2026-12-01",
    checkOut: "2026-12-04",
    guests: 2,
    guestName: "Chị Mai",
    actor: GUEST,
    guestEmail: "guest@example.com",
  });
  let world = acceptRequest(created.world, {
    handling: "EXCLUSIVE",
    requestId: created.request.id,
    actor: HOST,
  }).world;
  const obligation = world.obligations.find(
    (item) => item.requestId === created.request.id && item.kind === "INITIAL",
  );
  if (!obligation) throw new Error("missing obligation");
  world = recordPayment(world, {
    obligationId: obligation.id,
    outcome: "SUCCEEDED",
    actor: ADMIN,
  }).world;
  const stay = world.stays.find((item) => item.requestId === created.request.id);
  const booking = world.bookings.find((item) => item.requestId === created.request.id);
  if (!stay || !booking) throw new Error("missing stayora stay");
  return { world, stay, booking, requestId: created.request.id };
}

describe("slice 7 external accommodation", () => {
  it("records a fact without holding the calendar or creating a stay", () => {
    const world = createEmptyWorld(NOW);
    const recorded = recordExternalFact(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      source: "Zalo",
      guestName: "Anh Lộc",
      actor: HOST,
    });
    assert.equal(recorded.fact.commitmentId, undefined);
    assert.equal(recorded.world.stays.length, 0);
    assert.equal(recorded.world.commitments.length, 0);
    assert.equal(isAvailable(recorded.world, "t04", "2026-12-10", "2026-12-13"), true);
    assert.deepEqual(moneyCount(recorded.world), moneyCount(world));
  });

  it("records a fact and an external commitment as a scheduled stay, not a Stayora booking", () => {
    const world = createEmptyWorld(NOW);
    const recorded = recordExternalBooking(world, {
      villaId: "t04",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      source: "Airbnb",
      guestName: "Chị Diễm",
      actor: HOST,
    });
    assert.equal(recorded.stay.origin, "EXTERNAL");
    assert.equal(recorded.stay.originLabel, "Airbnb");
    assert.equal(recorded.stay.status, "SCHEDULED");
    assert.equal(recorded.stay.bookingId, undefined);
    assert.equal(recorded.commitment.basis, "EXTERNAL");
    assert.equal(recorded.commitment.status, "ACTIVE");
    assert.equal(recorded.commitment.externalId, recorded.world.externalAccommodations[0]?.id);
    assert.equal(isAvailable(recorded.world, "t04", "2026-12-10", "2026-12-13"), false);
    assert.deepEqual(moneyCount(recorded.world), {
      bookings: 0,
      obligations: 0,
      attempts: 0,
      commissions: 0,
      refunds: 0,
    });
    assert.equal(recorded.conflict, undefined);
  });

  it("keeps both commitments when an external stay overlaps Stayora", () => {
    const booked = stayoraStay();
    const before = moneyCount(booked.world);
    const overlap = recordExternalBooking(booked.world, {
      villaId: "t01",
      checkIn: "2026-12-02",
      checkOut: "2026-12-05",
      guests: 2,
      source: "Booking.com",
      guestName: "Anh Phong",
      actor: HOST,
    });
    const stayora = overlap.world.commitments.find(
      (item) => item.bookingId === booked.booking.id && item.kind === "CONFIRMED_ACCOMMODATION",
    );
    assert.ok(stayora);
    assert.equal(stayora.status, "ACTIVE");
    assert.equal(overlap.commitment.status, "ACTIVE");
    assert.notEqual(stayora.id, overlap.commitment.id);
    assert.equal(overlap.world.bookings.find((item) => item.id === booked.booking.id)?.status, "CONFIRMED");
    assert.equal(overlap.world.conflicts.filter((item) => item.status === "OPEN").length, 1);
    assert.equal(overlap.world.conflicts.some((item) => item.status === "RESOLVED"), false);
    const fact = overlap.world.externalAccommodations.find((item) => item.id === overlap.commitment.externalId);
    assert.equal(fact?.source, "Booking.com");
    assert.equal(fact?.commitmentId, overlap.commitment.id);
    assert.equal(overlap.world.obligations.length, before.obligations);
    assert.equal(overlap.world.commissions.length, before.commissions);

    const externalFirst = recordExternalBooking(createEmptyWorld(NOW), {
      villaId: "t06",
      checkIn: "2026-12-10",
      checkOut: "2026-12-13",
      guests: 2,
      source: "Zalo",
      actor: HOST,
    });
    assert.throws(
      () =>
        createRequest(externalFirst.world, {
          villaId: "t06",
          checkIn: "2026-12-11",
          checkOut: "2026-12-14",
          guests: 2,
          guestName: "Chị Hoa",
          actor: GUEST,
          guestEmail: "guest@example.com",
        }),
      (error: unknown) => error instanceof DomainError && error.code === "NOT_AVAILABLE",
    );
    assert.equal(
      externalFirst.world.commitments.find((item) => item.id === externalFirst.commitment.id)?.status,
      "ACTIVE",
    );
    assert.equal(externalFirst.world.stays[0]?.status, "SCHEDULED");
    assert.equal(externalFirst.world.bookings.length, 0);
    assert.equal(externalFirst.world.externalAccommodations[0]?.source, "Zalo");
  });

  it("walks an external stay through Slice 6 without Stayora money", () => {
    const recorded = recordExternalBooking(createEmptyWorld(NOW), {
      villaId: "t01",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      source: "Khách quen",
      guestName: "Gia đình Lê",
      actor: HOST,
    });
    assert.equal(recorded.stay.status, "SCHEDULED");
    assert.equal(readinessOf(recorded.world, "t01").state, "DIRTY");
    const cleaning = beginCleaning(recorded.world, { villaId: "t01", actor: BUTLER });
    const ready = completeCleaning(cleaning.world, { villaId: "t01", actor: BUTLER });
    assert.equal(ready.readiness.state, "READY");
    assert.equal(ready.world.stays[0]?.status, "SCHEDULED");

    const seen = observeArrival(ready.world, { stayId: recorded.stay.id, actor: BUTLER });
    assert.equal(seen.stay.status, "SCHEDULED");
    assert.ok(seen.stay.arrivalObservedAt);
    assert.equal(seen.stay.checkedInAt, undefined);
    const action = drawerAction(seen.stay, "READY", "2026-12-01");
    assert.equal(action?.kind, "stay");
    if (action?.kind === "stay") assert.equal(action.id, "check-in");

    const inside = checkInStay(seen.world, { stayId: recorded.stay.id, actor: BUTLER });
    assert.equal(inside.stay.status, "CHECKED_IN");
    const left = observeDeparture(inside.world, { stayId: recorded.stay.id, actor: BUTLER });
    assert.equal(left.stay.status, "CHECKED_IN");
    assert.equal(left.stay.checkedOutAt, undefined);
    assert.equal(readinessOf(left.world, "t01").state, "DIRTY");

    const done = checkoutWithAssessment(left.world, {
      stayId: recorded.stay.id,
      actor: BUTLER,
      outcome: "NORMAL",
    });
    assert.equal(done.stay.status, "COMPLETED");
    assert.equal(done.world.auditLog.find((item) => item.action === "CHECK_OUT")?.persona, "BUTLER");
    assert.equal(done.world.auditLog.find((item) => item.action === "COMPLETE")?.persona, "PLATFORM_POLICY");
    assert.deepEqual(moneyCount(done.world), {
      bookings: 0,
      obligations: 0,
      attempts: 0,
      commissions: 0,
      refunds: 0,
    });
    assert.equal(done.world.externalAccommodations[0]?.source, "Khách quen");
  });

  it("does not give Butler an external-recording action", () => {
    const world = createEmptyWorld(NOW);
    assert.throws(
      () =>
        recordExternalFact(world, {
          villaId: "t01",
          checkIn: "2026-12-10",
          checkOut: "2026-12-12",
          guests: 2,
          source: "Airbnb",
          actor: BUTLER,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    assert.throws(
      () =>
        recordExternalBooking(world, {
          villaId: "t01",
          checkIn: "2026-12-10",
          checkOut: "2026-12-12",
          guests: 2,
          source: "Airbnb",
          actor: SALE,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "FORBIDDEN",
    );
    const ops = source("../routes/ops.tsx");
    const calendar = source("../components/host-calendar.tsx");
    const host = source("../routes/host.tsx");
    assert.equal(ops.includes("Chỉ ghi nhận"), false);
    assert.equal(ops.includes("Ghi nhận và giữ chỗ"), false);
    assert.equal(ops.includes("hostRecordFact"), false);
    assert.equal(ops.includes("RECORD_EXTERNAL"), false);
    assert.match(calendar, /Không giữ lịch\. Không tạo kỳ ở\./);
    assert.match(calendar, /Giữ lịch và tạo kỳ ở để quản gia nhận phòng/);
    assert.match(calendar, /không ghi đè/i);
    assert.equal(calendar.includes("Ghi đặt ngoài chồng lên"), false);
    assert.match(host, /Ghi nhận này chưa giữ lịch và chưa tạo kỳ ở/);
    assert.match(host, /không phải đặt Stayora/);
  });
});

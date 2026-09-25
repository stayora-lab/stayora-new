import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { seedFromPilot } from "./seed-pilot.ts";
import { butlerFieldBoard } from "./domain/engine.ts";
import { PILOT_SEED } from "./pilot-data.ts";

const NOW = "2026-09-24T02:00:00.000Z";

function todayIct(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

describe("fictional test dataset", () => {
  it("covers the labelled spec situations", () => {
    const world = seedFromPilot(NOW);
    const today = todayIct(NOW);
    const status = (id: string) => world.requests.find((item) => item.id === id)?.status;

    assert.equal(PILOT_SEED.villas.length, 12);
    assert.ok(PILOT_SEED.people?.some((person) => person.id === "an"));
    assert.ok(
      PILOT_SEED.grants?.filter((grant) => grant.personId === "an").map((grant) => grant.role),
    );
    const anRoles = PILOT_SEED.grants?.filter((grant) => grant.personId === "an") ?? [];
    assert.ok(anRoles.some((grant) => grant.role === "HOST"));
    assert.ok(anRoles.some((grant) => grant.role === "SALE"));
    assert.equal(
      PILOT_SEED.villas.find((villa) => villa.id === "t03")?.relationship,
      "Thuê lại",
    );
    const coOwners = PILOT_SEED.grants?.filter((grant) => grant.scopeRef === "host-co") ?? [];
    assert.equal(coOwners.length, 2);
    assert.equal(PILOT_SEED.butlers.length, 2);
    assert.equal(PILOT_SEED.bql?.length, 1);

    const sources = new Set<string>(
      world.commitments
        .filter((item) => item.basis === "EXTERNAL")
        .map((item) => item.source ?? ""),
    );
    for (const source of ["Airbnb", "Booking.com", "Agoda", "Zalo", "Khách quen", "Khác"]) {
      assert.ok(sources.has(source), source);
    }
    assert.ok(world.conflicts.some((item) => item.status === "OPEN" && item.villaId === "t05"));
    assert.ok(
      world.commitments.some(
        (item) => item.kind === "AVAILABILITY_BLOCK" && item.blockKind === "OWNER",
      ),
    );
    assert.ok(
      world.commitments.some(
        (item) => item.kind === "AVAILABILITY_BLOCK" && item.blockKind === "MAINTENANCE",
      ),
    );

    assert.equal(status("req_seed_pending"), "PENDING");
    assert.equal(status("req_seed_expired"), "EXPIRED");
    assert.equal(status("req_seed_conflicted"), "CONFLICTED");
    assert.equal(status("req_seed_rejected"), "DECLINED");
    const soon = world.requests.find((item) => item.id === "req_seed_hold_soon");
    assert.equal(soon?.status, "ACCEPTED");
    const left = Date.parse(soon?.holdExpiresAt ?? "") - Date.parse(world.now);
    assert.ok(left > 0 && left < 5 * 60 * 1000);

    assert.equal(world.attempts.filter((item) => item.status === "UNKNOWN").length, 1);
    assert.ok(world.refundCases.some((item) => item.reason === "DUPLICATE_PAYMENT"));
    assert.ok(world.stays.some((item) => item.villaId === "t07" && item.status === "SCHEDULED"));
    assert.ok(
      world.bookings.some(
        (item) => item.villaId === "t07" && item.status === "CANCELLED" && item.guestName === "Chị Hoa",
      ),
    );

    const scheduled = world.stays.find(
      (item) => item.villaId === "t01" && item.origin === "STAYORA" && item.checkIn === today,
    );
    assert.equal(scheduled?.status, "SCHEDULED");
    assert.equal(scheduled?.checkIn, today);
    assert.ok(world.stays.some((item) => item.villaId === "t06" && item.status === "CHECKED_IN"));
    assert.ok(world.stays.some((item) => item.villaId === "t04" && item.status === "COMPLETED"));
    assert.ok(world.stays.some((item) => item.villaId === "t03" && item.status === "DID_NOT_OCCUR"));
  });

  it("butler morning board names the villa to prepare, who arrives, and who leaves", () => {
    const world = seedFromPilot(NOW);
    const today = todayIct(NOW);
    const chi = PILOT_SEED.butlers.find((person) => person.id === "butler-chi");
    const board = butlerFieldBoard(world, today, chi?.villaIds ?? []);
    assert.deepEqual(
      board.prepare.map((stay) => stay.villaId).sort(),
      ["t01", "t06"],
    );
    assert.equal(board.arriving.find((stay) => stay.villaId === "t01")?.guestName, "Chị Mai");
    assert.equal(board.departing.find((stay) => stay.villaId === "t06")?.guestName, "Anh Long");
    assert.equal(board.departing.find((stay) => stay.villaId === "t06")?.status, "CHECKED_IN");
  });

  it("keeps a varied T01–T06 week for the assigned butler", () => {
    const world = seedFromPilot(NOW);
    const today = todayIct(NOW);
    const mine = new Set(["t01", "t02", "t03", "t04", "t05", "t06"]);
    const stays = world.stays.filter((stay) => mine.has(stay.villaId));
    const on = (offset: number) => {
      const date = new Date(`${today}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + offset);
      return date.toISOString().slice(0, 10);
    };
    const arriving = (offset: number) =>
      stays.filter(
        (stay) =>
          stay.checkIn === on(offset) &&
          stay.status !== "DID_NOT_OCCUR" &&
          stay.status !== "CANCELLED",
      );
    assert.ok(arriving(0).length >= 2, "two arrivals today");
    assert.ok(arriving(1).length >= 2, "two arrivals tomorrow");
    assert.ok(
      stays.filter((stay) => stay.checkIn === on(3) || stay.checkIn === on(4)).length >= 2,
      "two arrivals in 3–4 days",
    );
    const departureDays = new Set(
      stays
        .filter(
          (stay) =>
            stay.status !== "DID_NOT_OCCUR" &&
            stay.status !== "CANCELLED" &&
            stay.checkOut >= today &&
            stay.checkOut <= on(7),
        )
        .map((stay) => stay.checkOut),
    );
    assert.ok(departureDays.size >= 3, [...departureDays].join(","));
    assert.ok(
      stays.some(
        (stay) => stay.status === "CHECKED_IN" && stay.checkIn < today && today < stay.checkOut,
      ),
    );
    assert.ok(stays.some((stay) => stay.status === "CHECKED_OUT" && !stay.completedAt));
    assert.ok(stays.some((stay) => stay.status === "COMPLETED" && stay.checkOut < today));
    for (const reason of ["BOOKING_CANCELLED", "NO_SHOW", "OTHER_AUTHORIZED_REASON"]) {
      assert.ok(
        stays.some((stay) => stay.status === "DID_NOT_OCCUR" && stay.didNotOccurReason === reason),
        reason,
      );
    }
    const names = stays.map((stay) => stay.guestName);
    assert.equal(new Set(names).size, names.length);
    assert.ok(names.every((name) => !name.startsWith("Khách ")));
    assert.ok(stays.some((stay) => stay.guests >= 8));
    assert.ok(stays.some((stay) => stay.guests === 2));
    const external = stays.filter((stay) => stay.origin === "EXTERNAL");
    assert.ok(external.length >= 3);
    assert.ok(new Set(external.map((stay) => stay.originLabel)).size >= 3);
    assert.ok(
      (world.externalAccommodations ?? []).some(
        (fact) => mine.has(fact.villaId) && !fact.commitmentId,
      ),
    );
    assert.ok(
      (world.protectiveHolds ?? []).some((hold) => hold.status === "ACTIVE" && mine.has(hold.villaId)),
    );
    assert.ok(
      world.commitments.some(
        (item) =>
          item.kind === "AVAILABILITY_BLOCK" && item.blockKind === "MAINTENANCE" && mine.has(item.villaId),
      ),
    );
    assert.ok(
      world.commitments.some(
        (item) =>
          item.kind === "AVAILABILITY_BLOCK" && item.blockKind === "OWNER" && mine.has(item.villaId),
      ),
    );
    assert.ok(world.conflicts.some((item) => item.status === "OPEN" && mine.has(item.villaId)));
    const competitive = world.requests.filter(
      (item) =>
        mine.has(item.villaId) && item.handling === "COMPETITIVE" && item.status === "ACCEPTED",
    );
    assert.equal(competitive.length, 2);
    assert.equal(
      world.commitments.filter(
        (item) => item.kind === "HOLD" && competitive.some((request) => request.id === item.requestId),
      ).length,
      0,
    );
  });
});

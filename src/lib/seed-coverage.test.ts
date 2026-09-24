import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { seedFromPilot } from "./seed-pilot.ts";
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
    assert.ok(world.stays.some((item) => item.villaId === "t07" && item.status === "CANCELLED"));

    const scheduled = world.stays.find(
      (item) => item.villaId === "t01" && item.origin === "STAYORA",
    );
    assert.equal(scheduled?.status, "SCHEDULED");
    assert.equal(scheduled?.checkIn, today);
    assert.ok(world.stays.some((item) => item.villaId === "t06" && item.status === "CHECKED_IN"));
    assert.ok(world.stays.some((item) => item.villaId === "t04" && item.status === "COMPLETED"));
    assert.ok(world.stays.some((item) => item.villaId === "t03" && item.status === "DID_NOT_OCCUR"));
  });
});

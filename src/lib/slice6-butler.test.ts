import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { BUTLER_LINH } from "./domain/catalog.ts";
import { GUEST_POST_STAY_READ_MS, VILLA_FRESHNESS_MS } from "./domain/config.ts";
import {
  acceptRequest,
  advanceTime,
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
  recordPayment,
  activeEnhancedCleaningNote,
} from "./domain/engine.ts";
import { guestStayAccess } from "./guest-access.ts";
import { dayLayout, drawerAction } from "./butler-board-view.ts";
import type { Actor, World } from "./domain/types.ts";

const NOW = "2026-09-22T03:00:00.000Z";
const HOST: Actor = { persona: "HOST" };
const ADMIN: Actor = { persona: "ADMIN" };
const GUEST: Actor = { persona: "GUEST" };
const BUTLER: Actor = { persona: "BUTLER", butlerId: BUTLER_LINH };

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function pay(world: World, requestId: string) {
  const obligation = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "INITIAL",
  );
  if (!obligation) throw new Error("missing obligation");
  return recordPayment(world, { obligationId: obligation.id, outcome: "SUCCEEDED", actor: ADMIN });
}

function checkedInStay() {
  let world = createEmptyWorld(NOW);
  const created = createRequest(world, {
    villaId: "t01",
    checkIn: "2026-12-01",
    checkOut: "2026-12-04",
    guests: 2,
    guestName: "Mai",
    guestPhone: "0901000001",
    actor: GUEST,
  });
  world = acceptRequest(created.world, {
    handling: "EXCLUSIVE",
    requestId: created.request.id,
    actor: HOST,
  }).world;
  const paid = pay(world, created.request.id);
  world = checkInStay(paid.world, { stayId: paid.stay!.id, actor: BUTLER }).world;
  return { world, stayId: paid.stay!.id, bookingId: paid.booking!.id };
}

function cardFor(world: World, date: string) {
  const layout = dayLayout(world, date, ["t01"], date, { canAct: true, canHold: false });
  return [...layout.pinned, ...layout.late, ...layout.windows.flatMap((window) => window.cards)].find(
    (card) => card.villaId === "t01",
  );
}

describe("slice 6 butler semantics", () => {
  it("keeps readiness on DIRTY → CLEANING → READY and off the commercial calendar", () => {
    const booked = checkedInStay();
    assert.throws(
      () => completeCleaning(booked.world, { villaId: "t01", actor: BUTLER }),
      (error: unknown) => error instanceof DomainError,
    );
    const cleaning = beginCleaning(booked.world, { villaId: "t01", actor: BUTLER });
    assert.equal(cleaning.readiness.state, "CLEANING");
    assert.throws(
      () => beginCleaning(cleaning.world, { villaId: "t01", actor: BUTLER }),
      (error: unknown) => error instanceof DomainError,
    );
    const ready = completeCleaning(cleaning.world, { villaId: "t01", actor: BUTLER });
    assert.equal(ready.readiness.state, "READY");
    const dirtyOnly = {
      ...createEmptyWorld(NOW),
      villaReadiness: [{ villaId: "t01", state: "DIRTY" as const, since: NOW }],
    };
    assert.equal(isAvailable(dirtyOnly, "t01", "2026-12-01", "2026-12-04"), true);
  });

  it("uses the Oceanami 72 hour freshness window, not a universal constant", () => {
    assert.equal(VILLA_FRESHNESS_MS, 72 * 60 * 60 * 1000);
    let world = createEmptyWorld(NOW);
    world = {
      ...world,
      villaReadiness: [{ villaId: "t02", state: "READY", since: NOW, cause: "COMPLETE_CLEANING" }],
    };
    assert.equal(readinessOf(advanceTime(world, VILLA_FRESHNESS_MS - 1), "t02").state, "READY");
    const decayed = readinessOf(advanceTime(world, VILLA_FRESHNESS_MS), "t02");
    assert.equal(decayed.state, "DIRTY");
    assert.equal(decayed.cause, "FRESHNESS_DECAY");
    assert.match(source("../routes/ops.tsx"), /Đã quá 72 giờ — cần kiểm tra\/dọn lại|FRESHNESS_DETAIL/);
    assert.equal(source("../components/butler-villa-card.tsx").includes("FRESHNESS_DECAY"), false);
  });

  it("does not treat arrival as check-in or departure as checkout", () => {
    const booked = checkedInStay();
    const arrived = observeArrival(booked.world, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(arrived.stay.status, "CHECKED_IN");
    assert.equal(
      arrived.stay.checkedInAt,
      booked.world.stays.find((item) => item.id === booked.stayId)?.checkedInAt,
    );
    const scheduled = createEmptyWorld(NOW);
    const created = createRequest(scheduled, {
      villaId: "t01",
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      guestName: "An",
      guestPhone: "0901000002",
      actor: GUEST,
    });
    let world = acceptRequest(created.world, {
      handling: "EXCLUSIVE",
      requestId: created.request.id,
      actor: HOST,
    }).world;
    world = pay(world, created.request.id).world;
    const stayId = world.stays.find((item) => item.requestId === created.request.id)!.id;
    const seen = observeArrival(world, { stayId, actor: BUTLER });
    assert.equal(seen.stay.status, "SCHEDULED");
    assert.equal(seen.stay.checkedInAt, undefined);
    const left = observeDeparture(booked.world, { stayId: booked.stayId, actor: BUTLER });
    assert.equal(left.stay.status, "CHECKED_IN");
    assert.equal(left.stay.checkedOutAt, undefined);
    assert.equal(readinessOf(left.world, "t01").state, "DIRTY");
    const next = drawerAction(left.stay, "DIRTY", "2026-12-04");
    assert.equal(next?.kind, "stay");
    if (next?.kind === "stay") assert.equal(next.id, "check-out");
  });

  it("requires the assessment inside checkout and completes only as a system result", () => {
    const booked = checkedInStay();
    const amounts = booked.world.obligations.map((item) => item.amount);
    const normal = checkoutWithAssessment(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      outcome: "NORMAL",
    });
    assert.equal(normal.completed, true);
    assert.equal(normal.stay.status, "COMPLETED");
    assert.ok(normal.stay.checkedOutAt);
    assert.ok(normal.stay.completedAt);
    assert.notEqual(normal.stay.checkedOutAt, undefined);
    assert.equal(normal.world.auditLog.some((item) => item.action === "CHECK_OUT"), true);
    assert.equal(normal.world.auditLog.some((item) => item.action === "COMPLETE"), true);
    assert.equal(
      normal.world.auditLog.find((item) => item.action === "CHECK_OUT")?.persona,
      "BUTLER",
    );
    const completion = normal.world.auditLog.find((item) => item.action === "COMPLETE");
    assert.ok(completion);
    assert.equal(completion.persona, "PLATFORM_POLICY");
    assert.notEqual(completion.persona, "BUTLER");
    assert.equal(
      normal.world.commitments.find((item) => item.bookingId === booked.bookingId)?.status,
      "ACTIVE",
    );
    assert.equal(isAvailable(normal.world, "t01", "2026-12-01", "2026-12-04"), false);
    assert.deepEqual(
      normal.world.obligations.map((item) => item.amount),
      amounts,
    );

    const enhanced = checkoutWithAssessment(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      outcome: "ENHANCED_CLEANING",
      note: "Cần giặt thảm",
    });
    assert.equal(enhanced.completed, true);
    assert.equal(enhanced.stay.status, "COMPLETED");
    assert.equal(readinessOf(enhanced.world, "t01").state, "DIRTY");
    assert.equal(enhanced.world.readinessNotes?.[0]?.kind, "ENHANCED_CLEANING");
    assert.equal(
      (enhanced.world.villaReadiness ?? []).some((item) => item.state === ("ENHANCED_CLEANING" as never)),
      false,
    );

    const damage = checkoutWithAssessment(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      outcome: "DAMAGE_COMPENSATION",
      note: "Vỡ đèn",
      hasPhoto: true,
    });
    assert.equal(damage.completed, false);
    assert.equal(damage.stay.status, "CHECKED_OUT");
    assert.equal(damage.stay.completedAt, undefined);
    assert.equal(damage.world.incidents[0]?.completionBlocker, true);
    assert.deepEqual(
      damage.world.obligations.map((item) => item.amount),
      amounts,
    );
    assert.equal(damage.world.refundCases.length, booked.world.refundCases.length);
    assert.equal(readinessOf(damage.world, "t01").state, "DIRTY");
    const damageCard = cardFor(damage.world, "2026-12-04");
    assert.equal(damageCard?.waitingResolution, true);
    assert.equal(damageCard?.action?.kind, "begin-cleaning");
    assert.equal(damage.world.stays.find((item) => item.id === booked.stayId)?.status, "CHECKED_OUT");

    const cleaning = beginCleaning(damage.world, { villaId: "t01", actor: BUTLER });
    assert.equal(cleaning.readiness.state, "CLEANING");
    assert.equal(cleaning.world.stays.find((item) => item.id === booked.stayId)?.status, "CHECKED_OUT");
    const cleaningCard = cardFor(cleaning.world, "2026-12-04");
    assert.equal(cleaningCard?.action?.kind, "complete-cleaning");
    assert.equal(cleaningCard?.waitingResolution, true);

    const ready = completeCleaning(cleaning.world, { villaId: "t01", actor: BUTLER });
    assert.equal(ready.readiness.state, "READY");
    const stay = ready.world.stays.find((item) => item.id === booked.stayId);
    assert.equal(stay?.status, "CHECKED_OUT");
    assert.equal(stay?.completedAt, undefined);
    assert.equal(ready.world.incidents[0]?.completionBlocker, true);
    assert.notEqual(ready.world.incidents[0]?.status, "RESOLVED");
    const readyCard = cardFor(ready.world, "2026-12-04");
    assert.equal(readyCard?.readiness, "READY");
    assert.equal(readyCard?.waitingResolution, true);
    assert.notEqual(readyCard?.action?.kind, "begin-cleaning");
    assert.notEqual(readyCard?.action?.kind, "complete-cleaning");
    assert.equal(ready.world.auditLog.some((item) => item.action === "COMPLETE"), false);
  });

  it("closes an enhanced-cleaning note when the villa reaches READY", () => {
    const booked = checkedInStay();
    const enhanced = checkoutWithAssessment(booked.world, {
      stayId: booked.stayId,
      actor: BUTLER,
      outcome: "ENHANCED_CLEANING",
      note: "Cần giặt thảm",
    });
    assert.equal(activeEnhancedCleaningNote(enhanced.world, "t01"), "Cần giặt thảm");
    const started = beginCleaning(enhanced.world, { villaId: "t01", actor: BUTLER });
    assert.equal(activeEnhancedCleaningNote(started.world, "t01"), "Cần giặt thảm");
    const finished = completeCleaning(started.world, { villaId: "t01", actor: BUTLER });
    assert.equal(finished.readiness.state, "READY");
    assert.equal(activeEnhancedCleaningNote(finished.world, "t01"), null);
    assert.equal(
      finished.world.readinessNotes?.some((item) => item.kind === "ENHANCED_CLEANING" && item.closedAt),
      true,
    );
    const decayed = advanceTime(finished.world, VILLA_FRESHNESS_MS);
    assert.equal(readinessOf(decayed, "t01").state, "DIRTY");
    assert.equal(readinessOf(decayed, "t01").cause, "FRESHNESS_DECAY");
    assert.equal(activeEnhancedCleaningNote(decayed, "t01"), null);
  });

  it("hides no-show and a manual complete action from the Butler surface", () => {
    const ops = source("../routes/ops.tsx");
    assert.equal(ops.includes("Lưu trú hoàn tất"), false);
    assert.equal(ops.includes("completeStay"), false);
    assert.equal(source("./world-actions.ts").includes("COMPLETE_STAY"), false);
    assert.equal(source("./store.ts").includes("completeStay"), false);
    assert.equal(ops.includes("Khách không đến"), false);
    assert.equal(ops.includes("butlerNoShow"), false);
    assert.equal(ops.includes("Gỡ chặn hư hại"), false);
    assert.match(ops, /butlerCheckoutWithAssessment/);
    assert.match(ops, /Bình thường/);
    assert.match(ops, /Có hư hỏng \/ cần xử lý bồi thường/);
    assert.match(ops, /Cần vệ sinh tăng cường/);
    assert.match(ops, /Đã thấy khách đến/);
    assert.match(ops, /Đã thấy khách rời villa/);
  });

  it("does not dispatch standalone checkout or a standalone assessment", () => {
    const actions = source("./world-actions.ts");
    const store = source("./store.ts");
    assert.equal(actions.includes('type: "CHECK_OUT"'), false);
    assert.equal(actions.includes('case "CHECK_OUT"'), false);
    assert.equal(actions.includes('type: "CHECKOUT_ASSESSMENT"'), false);
    assert.equal(actions.includes('case "CHECKOUT_ASSESSMENT"'), false);
    assert.match(actions, /type: "CHECKOUT_WITH_ASSESSMENT"/);
    assert.match(actions, /case "CHECKOUT_WITH_ASSESSMENT"/);
    assert.equal(store.includes("butlerCheckOut"), false);
    assert.equal(store.includes("recordCheckoutAssessment"), false);
    assert.equal(store.includes('type: "CHECK_OUT"'), false);
    assert.equal(store.includes('type: "CHECKOUT_ASSESSMENT"'), false);
    assert.match(store, /butlerCheckoutWithAssessment/);
    assert.match(store, /type: "CHECKOUT_WITH_ASSESSMENT"/);
  });

  it("keeps a completed Guest stay read-only for 30 days, then closed", () => {
    assert.equal(GUEST_POST_STAY_READ_MS, 30 * 24 * 60 * 60 * 1000);
    const completedAt = "2026-12-04T08:00:00.000Z";
    const stay = { status: "COMPLETED", completedAt };
    assert.equal(guestStayAccess({ status: "CHECKED_IN" }, NOW), "live");
    assert.equal(guestStayAccess(stay, "2026-12-04T09:00:00.000Z"), "read-only");
    assert.equal(
      guestStayAccess(stay, new Date(Date.parse(completedAt) + GUEST_POST_STAY_READ_MS - 1).toISOString()),
      "read-only",
    );
    assert.equal(
      guestStayAccess(stay, new Date(Date.parse(completedAt) + GUEST_POST_STAY_READ_MS).toISOString()),
      "ended",
    );
    const page = source("../routes/your-stay.$stayId.tsx");
    assert.match(page, /Kỳ nghỉ đã hoàn tất/);
    assert.match(page, /data-guest-readonly/);
    assert.equal(page.includes("DIRTY"), false);
    assert.equal(page.includes("CLEANING"), false);
  });
});

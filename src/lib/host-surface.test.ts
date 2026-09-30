import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  acceptRequest,
  createEmptyWorld,
  createRequest,
  recordPayment,
} from "./domain/engine.ts";
import {
  domainMessageVi,
  holdCountdown,
  hostPaymentStatus,
  requestBadgeVi,
  requestStatusVi,
} from "./domain/copy.ts";
import { DomainError, type Actor } from "./domain/types.ts";
import { protectiveHoldNote, stayOffersHostFollowUp } from "./host-surface.ts";

const HOST: Actor = { persona: "HOST" };
const ADMIN: Actor = { persona: "ADMIN" };
const GUEST: Actor = { persona: "GUEST" };
const NOW = "2026-09-22T03:00:00.000Z";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("accepted request label depends on handling", () => {
  it("a competitive acceptance is not an exclusive hold on Host or Sale", () => {
    assert.equal(requestStatusVi("ACCEPTED", "COMPETITIVE"), "Đã đồng ý, chờ thanh toán");
    assert.equal(requestBadgeVi("ACCEPTED", "COMPETITIVE", false), "Đã đồng ý, chờ thanh toán");
    assert.equal(requestBadgeVi("ACCEPTED", "COMPETITIVE", false).includes("Đang giữ chỗ"), false);
    assert.equal(requestStatusVi("ACCEPTED", "EXCLUSIVE"), "Đang giữ chỗ");
    assert.equal(requestBadgeVi("ACCEPTED", "EXCLUSIVE", false), "Đang giữ chỗ");
    assert.equal(requestBadgeVi("ACCEPTED", "COMPETITIVE", true), "Đã xác nhận");

    const host = source("../routes/host.tsx");
    const sale = source("../routes/sale.tsx");
    for (const page of [host, sale]) {
      assert.match(page, /requestBadgeVi\(request\.status, request\.handling/);
      assert.equal(page.includes("requestStatusVi("), false);
      assert.equal(page.includes("Hạn phản hồi"), false);
      assert.match(page, /Khách còn /);
    }
  });
});

describe("host payment lines", () => {
  it("shows the unpaid deposit and not the balance, then both after the deposit succeeds", () => {
    let world = createEmptyWorld(NOW);
    const created = createRequest(world, {
      villaId: "t01",
      checkIn: "2026-12-01",
      checkOut: "2026-12-04",
      guests: 2,
      guestName: "Anh Bình",
      actor: GUEST,
    guestEmail: "guest@example.com",
  });
    world = acceptRequest(created.world, {
      handling: "COMPETITIVE",
      requestId: created.request.id,
      actor: HOST,
    }).world;
    const unpaid = hostPaymentStatus(world, created.request.id);
    assert.equal(unpaid.length, 1);
    assert.match(unpaid[0]!, /^Chưa nhận ₫/);
    assert.match(unpaid[0]!, /\(cọc\)/);
    assert.equal(unpaid.some((line) => line.includes("Còn lại")), false);

    const initial = world.obligations.find(
      (item) => item.requestId === created.request.id && item.kind === "INITIAL",
    );
    assert.ok(initial);
    const paid = recordPayment(world, {
      obligationId: initial.id,
      outcome: "SUCCEEDED",
      actor: ADMIN,
    });
    const lines = hostPaymentStatus(paid.world, created.request.id);
    assert.ok(lines.includes("Đã nhận 50%"));
    assert.ok(lines.some((line) => line.startsWith("Còn lại ")));
  });
});

describe("protective hold confirmation", () => {
  it("is not created without confirmation and a reason", () => {
    assert.equal(protectiveHoldNote({ confirmed: false, reason: "Máy lạnh hỏng" }), null);
    assert.equal(protectiveHoldNote({ confirmed: true, reason: "   " }), null);
    assert.equal(protectiveHoldNote({ confirmed: true, reason: " Máy lạnh hỏng " }), "Máy lạnh hỏng");
  });

  it("is not offered on a did-not-occur or already ended stay", () => {
    assert.equal(stayOffersHostFollowUp("DID_NOT_OCCUR"), false);
    assert.equal(stayOffersHostFollowUp("CHECKED_OUT"), false);
    assert.equal(stayOffersHostFollowUp("COMPLETED"), false);
    assert.equal(stayOffersHostFollowUp("CANCELLED"), false);
    assert.equal(stayOffersHostFollowUp("SCHEDULED"), true);
    assert.equal(stayOffersHostFollowUp("CHECKED_IN"), true);

    const card = source("../components/host-stay-card.tsx");
    assert.match(card, /stayOffersHostFollowUp\(stay\.status\)/);
    assert.match(card, /if \(!confirmed\) return;/);
    assert.match(card, /Chỗ mới sẽ bị chặn cho đến khi gỡ giữ\./);
    const host = source("../routes/host.tsx");
    assert.equal(host.includes('note.trim() || "Cần xem villa"'), false);
    assert.equal(host.includes("Ghi chú khi báo việc"), false);

    const calendar = source("../components/host-calendar.tsx");
    assert.match(calendar, /protectiveHoldNote\(/);
    assert.match(calendar, /Xác nhận giữ/);
    assert.match(calendar, /Chỗ mới sẽ bị chặn cho đến khi gỡ giữ\./);
    assert.equal(calendar.includes('|| "Đang xem villa"'), false);
  });
});

describe("acceptance duration", () => {
  const now = new Date("2026-09-28T08:00:00.000Z");

  it("reads as minutes and hours, never zero hours", () => {
    assert.equal(holdCountdown(new Date(now.getTime() + 30 * 60_000).toISOString(), now), "30 phút");
    assert.equal(holdCountdown(new Date(now.getTime() + 2 * 3_600_000).toISOString(), now), "2 giờ");
    assert.equal(holdCountdown(new Date(now.getTime() + 75 * 60_000).toISOString(), now), "1 giờ 15 phút");
    assert.equal(holdCountdown(new Date(now.getTime() + 20_000).toISOString(), now), "dưới 1 phút");
    assert.equal(holdCountdown(new Date(now.getTime() - 1_000).toISOString(), now), "đã hết hạn");
    assert.equal(holdCountdown(new Date(now.getTime() + 30 * 60_000).toISOString(), now).includes("0 giờ"), false);
  });
});

describe("maintenance refusal", () => {
  it("keeps the plain-language reason and shows it in the sticky notice", () => {
    assert.equal(
      domainMessageVi(new DomainError("BOOKING_REMAINS", "A booking is still on these dates")),
      "Đặt chỗ hiện có vẫn giữ. Chưa ghi bảo trì.",
    );
    const host = source("../routes/host.tsx");
    assert.match(host, /role="status"/);
    assert.match(host, /Đã chuyển thành bảo trì:/);
    assert.match(host, /domainMessageVi\(err\)/);
  });
});

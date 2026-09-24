import { addDays, format, parseISO } from "date-fns";
import { HOLD_MS } from "./domain/config.ts";
import {
  acceptRequest,
  advanceTime,
  checkInStay,
  checkOutStay,
  createBlock,
  createEmptyWorld,
  createRequest,
  markDidNotOccur,
  recordExternalBooking,
  recordPayment,
  rejectRequest,
  resolveConflict,
  type World,
} from "./domain/index.ts";
import { PILOT_SEED, type PilotBlock, type PilotStay } from "./pilot-data.ts";

const HOST = { persona: "HOST" as const };
const ADMIN = { persona: "ADMIN" as const };
const GUEST = { persona: "GUEST" as const };
const SALE = { persona: "SALE" as const, saleId: "sale-an" };
const BUTLER_CHI = { persona: "BUTLER" as const, butlerId: "butler-chi" };

function ictDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function shift(today: string, offset: number): string {
  return format(addDays(parseISO(today), offset), "yyyy-MM-dd");
}

function resolveStay(today: string, stay: PilotStay): { checkIn: string; checkOut: string } {
  if (stay.checkIn && stay.checkOut) return { checkIn: stay.checkIn, checkOut: stay.checkOut };
  const checkIn = shift(today, stay.checkInOffset ?? 0);
  return { checkIn, checkOut: shift(checkIn, stay.nights ?? 2) };
}

function resolveBlock(today: string, block: PilotBlock): { start: string; end: string } {
  if (block.start && block.end) return { start: block.start, end: block.end };
  const start = shift(today, block.startOffset ?? 1);
  return { start, end: shift(start, block.nights ?? 2) };
}

function payInitial(world: World, requestId: string): World {
  const obligation = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "INITIAL",
  );
  if (!obligation) return world;
  return recordPayment(world, { obligationId: obligation.id, outcome: "SUCCEEDED", actor: ADMIN }).world;
}

/** Build the field-test World from data/pilot-seed.json using engine paths. Dates follow "today". */
export function seedFromPilot(now = new Date().toISOString()): World {
  const today = ictDate(now);
  let world = createEmptyWorld(now);
  world = {
    ...world,
    sales: PILOT_SEED.sales.map((person) => ({ id: person.id, name: person.name })),
    butlers: PILOT_SEED.butlers.map((person) => ({
      id: person.id,
      name: person.name,
      villaIds: person.villaIds,
    })),
  };

  // Stays that later overlap a Stayora booking are recorded AFTER that booking.
  const laterExternal = new Set(["t05", "t07"]);
  const overlapExternal = PILOT_SEED.existingStays.filter((stay) => laterExternal.has(stay.villaId));
  const otherExternal = PILOT_SEED.existingStays.filter((stay) => !laterExternal.has(stay.villaId));
  for (const stay of otherExternal) {
    const dates = resolveStay(today, stay);
    world = recordExternalBooking(world, {
      villaId: stay.villaId,
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
      guests: stay.guests,
      source: stay.source,
      guestName: stay.guestName,
      actor: HOST,
    }).world;
  }

  for (const block of PILOT_SEED.blocks) {
    const dates = resolveBlock(today, block);
    world = createBlock(world, {
      villaId: block.villaId,
      start: dates.start,
      end: dates.end,
      blockKind: block.kind,
      actor: HOST,
    }).world;
  }

  world = seedStayoraScenarios(world, today);
  return world;
}

function seedStayoraScenarios(world: World, today: string): World {
  // Hold EXPIRED then a hold about to expire. Clock moves only here, first.
  {
    const expired = createRequest(world, {
      villaId: "t02",
      checkIn: shift(today, 28),
      checkOut: shift(today, 31),
      guests: 2,
      guestName: "Khách hết hạn giữ",
      actor: GUEST,
      id: "req_seed_expired",
    });
    world = acceptRequest(expired.world, { requestId: expired.request.id, actor: HOST }).world;
    world = advanceTime(world, HOLD_MS + 60_000);
    const soon = createRequest(world, {
      villaId: "t09",
      checkIn: shift(today, 36),
      checkOut: shift(today, 39),
      guests: 4,
      guestName: "Khách giữ sắp hết hạn",
      actor: SALE,
      id: "req_seed_hold_soon",
    });
    world = acceptRequest(soon.world, { requestId: soon.request.id, actor: HOST }).world;
    world = advanceTime(world, HOLD_MS - 2 * 60_000);
  }

  // SCHEDULED today (check-in today).
  {
    const created = createRequest(world, {
      villaId: "t01",
      checkIn: today,
      checkOut: shift(today, 3),
      guests: 4,
      guestName: "Khách lịch hôm nay",
      actor: SALE,
      id: "req_seed_scheduled_today",
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    world = payInitial(world, created.request.id);
  }

  // CHECKED_IN (arrived yesterday, still in house).
  {
    const created = createRequest(world, {
      villaId: "t06",
      checkIn: shift(today, -1),
      checkOut: shift(today, 3),
      guests: 4,
      guestName: "Khách đang ở",
      actor: GUEST,
      id: "req_seed_checked_in",
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    world = payInitial(world, created.request.id);
    const stay = world.stays.find((item) => item.requestId === created.request.id);
    if (stay) world = checkInStay(world, { stayId: stay.id, actor: BUTLER_CHI }).world;
  }

  // CHECKED_OUT / COMPLETED (left yesterday).
  {
    const created = createRequest(world, {
      villaId: "t04",
      checkIn: shift(today, -4),
      checkOut: shift(today, -1),
      guests: 2,
      guestName: "Khách đã trả phòng",
      actor: SALE,
      id: "req_seed_completed",
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    world = payInitial(world, created.request.id);
    const stay = world.stays.find((item) => item.requestId === created.request.id);
    if (stay) {
      world = checkInStay(world, { stayId: stay.id, actor: BUTLER_CHI }).world;
      world = checkOutStay(world, { stayId: stay.id, actor: BUTLER_CHI }).world;
    }
  }

  // DID_NOT_OCCUR (was scheduled to arrive yesterday).
  {
    const created = createRequest(world, {
      villaId: "t03",
      checkIn: shift(today, -1),
      checkOut: shift(today, 2),
      guests: 4,
      guestName: "Khách không đến",
      actor: GUEST,
      id: "req_seed_no_show",
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    world = payInitial(world, created.request.id);
    const stay = world.stays.find((item) => item.requestId === created.request.id);
    if (stay) {
      world = markDidNotOccur(world, {
        stayId: stay.id,
        actor: BUTLER_CHI,
        reason: "Khách thử không đến",
      }).world;
    }
  }

  // Stayora booking that an Airbnb stay overlaps → OPEN conflict.
  {
    const created = createRequest(world, {
      villaId: "t05",
      checkIn: shift(today, 10),
      checkOut: shift(today, 13),
      guests: 4,
      guestName: "Khách Stayora trùng Airbnb",
      actor: SALE,
      id: "req_seed_conflict_stayora",
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    world = payInitial(world, created.request.id);
    const overlap = PILOT_SEED.existingStays.find((stay) => stay.villaId === "t05");
    if (overlap) {
      const dates = resolveStay(today, overlap);
      world = recordExternalBooking(world, {
        villaId: overlap.villaId,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests: overlap.guests,
        source: overlap.source,
        guestName: overlap.guestName,
        actor: HOST,
      }).world;
    }
  }

  // Booking CANCELLED by conflict (second overlapping Stayora vs external on T07).
  {
    const created = createRequest(world, {
      villaId: "t07",
      checkIn: shift(today, 5),
      checkOut: shift(today, 7),
      guests: 2,
      guestName: "Khách bị huỷ vì xung đột",
      actor: GUEST,
      id: "req_seed_cancelled_conflict",
    });
    const accepted = acceptRequest(created.world, { requestId: created.request.id, actor: HOST });
    world = accepted.world;
    world = payInitial(world, created.request.id);
    const overlap = PILOT_SEED.existingStays.find((stay) => stay.villaId === "t07");
    if (overlap) {
      const dates = resolveStay(today, overlap);
      world = recordExternalBooking(world, {
        villaId: overlap.villaId,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests: overlap.guests,
        source: overlap.source,
        guestName: overlap.guestName,
        actor: HOST,
      }).world;
    }
    const conflict = world.conflicts.find((item) => item.status === "OPEN" && item.villaId === "t07");
    const stayoraCmt = world.commitments.find(
      (item) => item.requestId === created.request.id && item.kind === "CONFIRMED_ACCOMMODATION",
    );
    const externalCmt = world.commitments.find(
      (item) => item.villaId === "t07" && item.basis === "EXTERNAL" && item.status === "ACTIVE",
    );
    if (conflict && stayoraCmt && externalCmt) {
      world = resolveConflict(world, {
        conflictId: conflict.id,
        keepCommitmentId: externalCmt.id,
        endCommitmentId: stayoraCmt.id,
        reason: "Giữ đặt ngoài, huỷ Stayora",
        actor: ADMIN,
      }).world;
    }
  }

  // PENDING request.
  {
    const created = createRequest(world, {
      villaId: "t08",
      checkIn: shift(today, 14),
      checkOut: shift(today, 17),
      guests: 2,
      guestName: "Khách đang chờ",
      actor: GUEST,
      id: "req_seed_pending",
    });
    world = created.world;
  }

  // REJECTED (DECLINED).
  {
    const created = createRequest(world, {
      villaId: "t12",
      checkIn: shift(today, 22),
      checkOut: shift(today, 24),
      guests: 2,
      guestName: "Khách bị từ chối",
      actor: GUEST,
      id: "req_seed_rejected",
    });
    world = rejectRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
  }

  // CONFLICTED: two pending on the same dates; first hold wins.
  {
    const first = createRequest(world, {
      villaId: "t11",
      checkIn: shift(today, 16),
      checkOut: shift(today, 19),
      guests: 2,
      guestName: "Khách giữ chỗ",
      actor: GUEST,
      id: "req_seed_hold_winner",
    });
    const second = createRequest(first.world, {
      villaId: "t11",
      checkIn: shift(today, 16),
      checkOut: shift(today, 19),
      guests: 2,
      guestName: "Khách bị xung đột",
      actor: GUEST,
      id: "req_seed_conflicted",
    });
    world = acceptRequest(second.world, { requestId: first.request.id, actor: HOST }).world;
    world = acceptRequest(world, { requestId: second.request.id, actor: HOST }).world;
  }

  // UNKNOWN payment (accepted hold, payment not resolved).
  {
    const created = createRequest(world, {
      villaId: "t09",
      checkIn: shift(today, 25),
      checkOut: shift(today, 28),
      guests: 4,
      guestName: "Khách thanh toán chưa rõ",
      actor: SALE,
      id: "req_seed_unknown",
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    const obligation = world.obligations.find(
      (item) => item.requestId === created.request.id && item.kind === "INITIAL",
    );
    if (obligation) {
      world = recordPayment(world, {
        obligationId: obligation.id,
        outcome: "UNKNOWN",
        actor: ADMIN,
      }).world;
    }
  }

  // DUPLICATE_PAYMENT refund: pay twice on T10 after a future stay confirm.
  {
    const created = createRequest(world, {
      villaId: "t10",
      checkIn: shift(today, 32),
      checkOut: shift(today, 35),
      guests: 4,
      guestName: "Khách thanh toán trùng",
      actor: SALE,
      id: "req_seed_duplicate",
    });
    world = acceptRequest(created.world, { requestId: created.request.id, actor: HOST }).world;
    const obligation = world.obligations.find(
      (item) => item.requestId === created.request.id && item.kind === "INITIAL",
    );
    if (obligation) {
      world = recordPayment(world, {
        obligationId: obligation.id,
        outcome: "SUCCEEDED",
        actor: ADMIN,
      }).world;
      world = recordPayment(world, {
        obligationId: obligation.id,
        outcome: "SUCCEEDED",
        actor: ADMIN,
      }).world;
    }
  }

  return world;
}

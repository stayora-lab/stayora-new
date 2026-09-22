import { differenceInCalendarDays, parseISO } from "date-fns";
import { BUTLER_LINH, paymentRuleOf, PILOT_NOW, SALE_MAI } from "./catalog.ts";
import { createEmptyWorld } from "./engine.ts";
import type { Booking, Commitment, Commission, Stay, StayRequest, World } from "./types.ts";

function nightsBetween(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

function confirmedBundle(input: {
  now: string;
  requestId: string;
  bookingId: string;
  stayId: string;
  commitmentId: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  saleId?: string;
  stayStatus: Stay["status"];
  origin: Stay["origin"];
  originLabel: string;
  assignedButlerId?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  completedAt?: string;
  reference: string;
}): {
  booking: Booking;
  stay: Stay;
  commitment: Commitment;
  commission?: Commission;
  request?: StayRequest;
} {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const nightly = { "sao-bien": 16_500_000, "huong-tram": 9_400_000, "minh-dam": 22_400_000, "gio-bien": 10_800_000, "cat-vang": 18_200_000, "sen-hong": 6_200_000 }[input.villaId] ?? 0;
  const total = nightly * nights;
  const booking: Booking = {
    id: input.bookingId,
    requestId: input.requestId,
    stayId: input.stayId,
    villaId: input.villaId,
    reference: input.reference,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName,
    nightly,
    nights,
    total,
    paymentRule: paymentRuleOf(input.villaId),
    saleId: input.saleId,
    status: "CONFIRMED",
    confirmedAt: input.now,
  };
  const stay: Stay = {
    id: input.stayId,
    bookingId: input.origin === "STAYORA" ? input.bookingId : undefined,
    requestId: input.origin === "STAYORA" ? input.requestId : undefined,
    villaId: input.villaId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName,
    origin: input.origin,
    originLabel: input.originLabel,
    status: input.stayStatus,
    assignedButlerId: input.assignedButlerId,
    checkedInAt: input.checkedInAt,
    checkedOutAt: input.checkedOutAt,
    completedAt: input.completedAt,
  };
  const commitment: Commitment = {
    id: input.commitmentId,
    villaId: input.villaId,
    start: input.checkIn,
    end: input.checkOut,
    kind: "CONFIRMED_ACCOMMODATION",
    requestId: input.origin === "STAYORA" ? input.requestId : undefined,
    bookingId: input.origin === "STAYORA" ? input.bookingId : undefined,
  };
  const commission: Commission | undefined = input.saleId
    ? {
        id: `com_${input.bookingId}`,
        bookingId: input.bookingId,
        stayId: input.stayId,
        saleId: input.saleId,
        amount: Math.round(total * 0.1),
        status: input.stayStatus === "COMPLETED" ? "EARNED" : "PENDING",
      }
    : undefined;
  const request: StayRequest | undefined = input.saleId
    ? {
        id: input.requestId,
        villaId: input.villaId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        guestName: input.guestName,
        nightly,
        nights,
        total,
        paymentRule: paymentRuleOf(input.villaId),
        source: "SALE",
        saleId: input.saleId,
        status: "CONFIRMED",
        createdAt: input.now,
        acceptedAt: input.now,
        confirmedAt: input.now,
        reference: input.reference,
        bookingId: input.bookingId,
        stayId: input.stayId,
      }
    : undefined;
  return { booking, stay, commitment, commission, request };
}

export function seedWorld(now = PILOT_NOW): World {
  const world = createEmptyWorld(now);
  const bundles = [
    confirmedBundle({
      now,
      requestId: "req_seed_depart",
      bookingId: "bkg_seed_depart",
      stayId: "sty_seed_depart",
      commitmentId: "cmt_seed_depart",
      villaId: "sao-bien",
      checkIn: "2026-09-19",
      checkOut: "2026-09-22",
      guests: 6,
      guestName: "Mai Phương",
      stayStatus: "CHECKED_IN",
      origin: "STAYORA",
      originLabel: "Stayora",
      assignedButlerId: BUTLER_LINH,
      checkedInAt: "2026-09-19T06:00:00.000Z",
      reference: "STY-8M2P",
    }),
    confirmedBundle({
      now,
      requestId: "req_seed_arrive",
      bookingId: "bkg_seed_arrive",
      stayId: "sty_seed_arrive",
      commitmentId: "cmt_seed_arrive",
      villaId: "gio-bien",
      checkIn: "2026-09-22",
      checkOut: "2026-09-25",
      guests: 5,
      guestName: "Lê Minh",
      stayStatus: "SCHEDULED",
      origin: "STAYORA",
      originLabel: "Stayora",
      assignedButlerId: BUTLER_LINH,
      reference: "STY-4K9Q",
    }),
    confirmedBundle({
      now,
      requestId: "req_seed_hill",
      bookingId: "bkg_seed_hill",
      stayId: "sty_seed_hill",
      commitmentId: "cmt_seed_hill",
      villaId: "minh-dam",
      checkIn: "2026-09-22",
      checkOut: "2026-09-26",
      guests: 8,
      guestName: "Ngô Hà",
      stayStatus: "SCHEDULED",
      origin: "STAYORA",
      originLabel: "Stayora",
      reference: "STY-2N7R",
    }),
    confirmedBundle({
      now,
      requestId: "req_seed_sale_future",
      bookingId: "bkg_seed_sale_future",
      stayId: "sty_seed_sale_future",
      commitmentId: "cmt_seed_sale_future",
      villaId: "cat-vang",
      checkIn: "2026-10-16",
      checkOut: "2026-10-19",
      guests: 8,
      guestName: "Phạm Gia",
      saleId: SALE_MAI,
      stayStatus: "SCHEDULED",
      origin: "STAYORA",
      originLabel: "Stayora",
      assignedButlerId: BUTLER_LINH,
      reference: "STY-9C3L",
    }),
    confirmedBundle({
      now,
      requestId: "req_seed_sale_done",
      bookingId: "bkg_seed_sale_done",
      stayId: "sty_seed_sale_done",
      commitmentId: "cmt_seed_sale_done",
      villaId: "sen-hong",
      checkIn: "2026-08-01",
      checkOut: "2026-08-04",
      guests: 2,
      guestName: "Trang & Olivier",
      saleId: SALE_MAI,
      stayStatus: "COMPLETED",
      origin: "STAYORA",
      originLabel: "Stayora",
      assignedButlerId: undefined,
      checkedInAt: "2026-08-01T06:00:00.000Z",
      checkedOutAt: "2026-08-04T04:00:00.000Z",
      completedAt: "2026-08-04T04:05:00.000Z",
      reference: "STY-1H5W",
    }),
    confirmedBundle({
      now,
      requestId: "req_seed_ext",
      bookingId: "bkg_seed_ext",
      stayId: "sty_seed_ext",
      commitmentId: "cmt_seed_ext",
      villaId: "huong-tram",
      checkIn: "2026-09-20",
      checkOut: "2026-09-24",
      guests: 4,
      guestName: "Gia đình Trần",
      stayStatus: "CHECKED_IN",
      origin: "EXTERNAL",
      originLabel: "Oceanami trực tiếp",
      checkedInAt: "2026-09-20T07:00:00.000Z",
      reference: "EXT-2209",
    }),
  ];

  return {
    ...world,
    requests: bundles.flatMap((item) => (item.request ? [item.request] : [])),
    bookings: bundles.map((item) => item.booking),
    stays: bundles.map((item) => item.stay),
    commitments: bundles.map((item) => item.commitment),
    commissions: bundles.flatMap((item) => (item.commission ? [item.commission] : [])),
  };
}

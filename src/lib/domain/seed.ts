import { BUTLER_LINH, nightsBetween, SALE_MAI } from "./catalog.ts";
import { PILOT_NOW } from "./config.ts";
import { createEmptyWorld } from "./engine.ts";
import type {
  Booking,
  Commitment,
  Commission,
  ExternalAccommodation,
  Stay,
  StayRequest,
  World,
} from "./types.ts";

const NIGHTLY: Record<string, number> = {
  "sao-bien": 16_500_000,
  "huong-tram": 9_400_000,
  "minh-dam": 22_400_000,
  "gio-bien": 10_800_000,
  "cat-vang": 18_200_000,
  "sen-hong": 6_200_000,
};

const OWNER_BLOCKS: { villaId: string; start: string; end: string }[] = [
  { villaId: "sao-bien", start: "2026-10-23", end: "2026-10-27" },
  { villaId: "huong-tram", start: "2026-11-12", end: "2026-11-16" },
  { villaId: "minh-dam", start: "2026-10-15", end: "2026-10-21" },
  { villaId: "sen-hong", start: "2026-11-01", end: "2026-11-05" },
  { villaId: "gio-bien", start: "2026-10-30", end: "2026-11-03" },
  { villaId: "cat-vang", start: "2026-09-28", end: "2026-10-03" },
];

function stayoraBundle(input: {
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
  assignedButlerId?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  completedAt?: string;
  reference: string;
  includeRequest?: boolean;
}): {
  booking: Booking;
  stay: Stay;
  commitment: Commitment;
  commission?: Commission;
  request?: StayRequest;
} {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const nightly = NIGHTLY[input.villaId] ?? 0;
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
    saleId: input.saleId,
    status: "CONFIRMED",
    confirmedAt: input.now,
  };
  const stay: Stay = {
    id: input.stayId,
    bookingId: input.bookingId,
    requestId: input.requestId,
    villaId: input.villaId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName,
    origin: "STAYORA",
    originLabel: "Stayora",
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
    status: "ACTIVE",
    basis: "STAYORA_BOOKING",
    requestId: input.requestId,
    bookingId: input.bookingId,
    stayId: input.stayId,
    reference: input.reference,
    createdBy: "HOST",
    createdAt: input.now,
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
  const request: StayRequest | undefined = input.includeRequest
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
        source: input.saleId ? "SALE" : "GUEST",
        saleId: input.saleId,
        status: "ACCEPTED",
        createdAt: input.now,
        acceptedAt: input.now,
      }
    : undefined;
  return { booking, stay, commitment, commission, request };
}

function pendingGuest(input: {
  now: string;
  id: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
}): StayRequest {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const nightly = NIGHTLY[input.villaId] ?? 0;
  return {
    id: input.id,
    villaId: input.villaId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    guestName: input.guestName,
    nightly,
    nights,
    total: nightly * nights,
    source: "GUEST",
    status: "PENDING",
    createdAt: input.now,
  };
}

export function seedWorld(now = PILOT_NOW): World {
  const world = createEmptyWorld(now);
  const bundles = [
    stayoraBundle({
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
      assignedButlerId: BUTLER_LINH,
      checkedInAt: "2026-09-19T06:00:00.000Z",
      reference: "STY-8M2P",
    }),
    stayoraBundle({
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
      assignedButlerId: BUTLER_LINH,
      reference: "STY-4K9Q",
    }),
    stayoraBundle({
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
      reference: "STY-2N7R",
    }),
    stayoraBundle({
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
      assignedButlerId: BUTLER_LINH,
      reference: "STY-9C3L",
      includeRequest: true,
    }),
    stayoraBundle({
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
      checkedInAt: "2026-08-01T06:00:00.000Z",
      checkedOutAt: "2026-08-04T04:00:00.000Z",
      completedAt: "2026-08-04T04:05:00.000Z",
      reference: "STY-1H5W",
      includeRequest: true,
    }),
  ];

  const external: ExternalAccommodation = {
    id: "ext_seed_huong",
    villaId: "huong-tram",
    checkIn: "2026-09-20",
    checkOut: "2026-09-24",
    guests: 4,
    source: "Khách quen",
  };
  const externalStay: Stay = {
    id: "sty_seed_ext",
    villaId: "huong-tram",
    checkIn: "2026-09-20",
    checkOut: "2026-09-24",
    guests: 4,
    guestName: "Gia đình Trần",
    origin: "EXTERNAL",
    originLabel: "Khách quen",
    status: "CHECKED_IN",
    checkedInAt: "2026-09-20T07:00:00.000Z",
  };
  const externalCommitment: Commitment = {
    id: "cmt_seed_ext",
    villaId: "huong-tram",
    start: "2026-09-20",
    end: "2026-09-24",
    kind: "CONFIRMED_ACCOMMODATION",
    status: "ACTIVE",
    basis: "EXTERNAL",
    stayId: "sty_seed_ext",
    externalId: "ext_seed_huong",
    source: "Khách quen",
    createdBy: "HOST",
    createdAt: now,
  };
  const blocks: Commitment[] = OWNER_BLOCKS.map((block, index) => ({
    id: `blk_seed_${index + 1}`,
    villaId: block.villaId,
    start: block.start,
    end: block.end,
    kind: "AVAILABILITY_BLOCK",
    status: "ACTIVE",
    basis: "BLOCK",
    blockKind: "OWNER",
    createdBy: "HOST",
    createdAt: now,
  }));
  const pending = [
    pendingGuest({
      now,
      id: "req_seed_guest_pending",
      villaId: "sen-hong",
      checkIn: "2026-10-16",
      checkOut: "2026-10-19",
      guests: 2,
      guestName: "Nguyễn An",
    }),
    pendingGuest({
      now,
      id: "req_seed_guest_pending_2",
      villaId: "huong-tram",
      checkIn: "2026-10-10",
      checkOut: "2026-10-13",
      guests: 4,
      guestName: "Lê Hoa",
    }),
  ];

  return {
    ...world,
    requests: [...pending, ...bundles.flatMap((item) => (item.request ? [item.request] : []))],
    bookings: bundles.map((item) => item.booking),
    stays: [...bundles.map((item) => item.stay), externalStay],
    commitments: [...bundles.map((item) => item.commitment), externalCommitment, ...blocks],
    commissions: bundles.flatMap((item) => (item.commission ? [item.commission] : [])),
    externalAccommodations: [external],
  };
}

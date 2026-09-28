/**
 * Client-safe transfer copy and the removal warning.
 * The database writes live in hosting-transfer.ts.
 *
 * PROTOTYPE ASSUMPTION: requests and stays are not tied to a Co-host identity.
 * The warning lists that unit's accepted requests, upcoming stays, and stays
 * with an assigned Butler. It omits money. It never blocks removal.
 * Unsettled financial matters are H-3 (ADR-P076) and are not shown here.
 */

export const COHOST_ROLE = "COHOST";

export const BASIS_NORMAL_ACCEPTANCE = "normal-transfer-acceptance";
export const BASIS_ADMIN_EXCEPTION = "admin-manual-exception";
export const BASIS_COHOST = "co-host-delegation";

/**
 * PROTOTYPE ASSUMPTION: the spec names "normal-transfer-acceptance" for the
 * moment authority moves, and does not name a token for the handshake before
 * that. Designation, decline, and cancel use this basis.
 */
export const BASIS_TRANSFER_PENDING = "normal-transfer-pending";

export type RemovalMatter = {
  kind: "accepted-request" | "upcoming-stay" | "butler-assignment";
  text: string;
};

type RequestSlice = {
  villaId: string;
  status: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
};

type StaySlice = {
  villaId: string;
  status: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  assignedButlerId?: string | null;
};

export function cohostRemovalMatters(input: {
  unitId: string;
  today: string;
  requests: readonly RequestSlice[];
  stays: readonly StaySlice[];
}): RemovalMatter[] {
  const matters: RemovalMatter[] = [];
  for (const request of input.requests) {
    if (request.villaId !== input.unitId || request.status !== "ACCEPTED") continue;
    matters.push({
      kind: "accepted-request",
      text: `Yêu cầu đã chấp nhận: ${request.guestName} · ${request.checkIn}`,
    });
  }
  for (const stay of input.stays) {
    if (stay.villaId !== input.unitId) continue;
    const open = stay.status === "SCHEDULED" || stay.status === "CHECKED_IN";
    if (open && stay.checkOut >= input.today) {
      matters.push({
        kind: "upcoming-stay",
        text: `Kỳ sắp tới: ${stay.guestName} · ${stay.checkIn}`,
      });
    }
    if (stay.assignedButlerId && open) {
      matters.push({
        kind: "butler-assignment",
        text: `Quản gia đã giao: ${stay.guestName}`,
      });
    }
  }
  return matters;
}

export type DeskCohost = { identityId: string; name: string; email: string };
export type DeskUnit = {
  unitId: string;
  pending: { id: string; recipientName: string; recipientEmail: string } | null;
  cohosts: DeskCohost[];
};
export type IncomingDesignation = {
  id: string;
  unitId: string;
  cohosts: DeskCohost[];
};

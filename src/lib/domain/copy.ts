import { format, parseISO } from "date-fns";
import { getVilla } from "../villas.ts";
import { paymentPlanLabel } from "./catalog.ts";
import { TIMEZONE } from "./config.ts";
import { obligationSucceeded } from "./engine.ts";
import { DomainError } from "./types.ts";
import type {
  Commitment,
  CommissionStatus,
  PaymentObligation,
  RequestStatus,
  StayRequest,
  World,
} from "./types.ts";

function formatVnd(amount: number): string {
  return `₫${amount.toLocaleString("en-US")}`;
}

export function viDateRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}–${format(end, "d/M/yyyy")}`;
  }
  return `${format(start, "d/M")}–${format(end, "d/M/yyyy")}`;
}

export function formatDueAt(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour12: false,
  }).formatToParts(parseISO(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")} ${get("day")}/${get("month")}/${get("year")}`;
}

export function formatIctTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(parseISO(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")}`;
}

export function balanceLine(obligation: PaymentObligation, paid: boolean): string {
  if (paid) return "Đã thanh toán đủ";
  return `Còn lại ${formatVnd(obligation.amount)} — hạn ${formatDueAt(obligation.dueAt)}`;
}

export function hostPaymentStatus(world: World, requestId: string): string[] {
  const initial = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "INITIAL",
  );
  const balance = world.obligations.find(
    (item) => item.requestId === requestId && item.kind === "BALANCE",
  );
  const unknown = world.attempts.find(
    (item) =>
      (item.obligationId === initial?.id || item.obligationId === balance?.id) &&
      item.status === "UNKNOWN",
  );
  if (unknown) return ["Đang xác minh thanh toán"];
  const lines: string[] = [];
  if (initial && obligationSucceeded(world, initial.id)) {
    lines.push(balance ? "Đã nhận 50%" : "Đã nhận 100%");
  }
  if (balance) {
    lines.push(balanceLine(balance, obligationSucceeded(world, balance.id)));
  }
  return lines;
}

export function commitmentCellLabel(commitment: Commitment): string {
  if (commitment.kind === "HOLD") {
    const until = commitment.expiresAt ? formatIctTime(commitment.expiresAt) : "";
    return until ? `Đang giữ · hết hạn ${until}` : "Đang giữ";
  }
  if (commitment.kind === "AVAILABILITY_BLOCK") {
    return commitment.blockKind === "MAINTENANCE" ? "Bảo trì" : "Chủ nhà chặn";
  }
  if (commitment.basis === "EXTERNAL") {
    return `Đặt ngoài · ${commitment.source ?? "Khác"}`;
  }
  return "Đặt qua Stayora";
}

export function personaLabel(persona: string): string {
  switch (persona) {
    case "GUEST":
      return "Khách";
    case "SALE":
      return "Sale";
    case "HOST":
      return "Host";
    case "BUTLER":
      return "Butler";
    case "BQL":
      return "BQL";
    case "ADMIN":
      return "Stayora vận hành";
    default:
      return persona;
  }
}

export function quoteText(request: {
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  paymentLabel: string;
  origin: string;
}): string {
  const villa = getVilla(request.villaId);
  const name = villa?.name ?? request.villaId;
  const sleeps = villa?.sleeps ?? "";
  return [
    `${name} · Oceanami · Phước Hải`,
    `${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách · ngủ ${sleeps}`,
    `${formatVnd(request.total)} (giá công khai)`,
    `Thanh toán ${request.paymentLabel}`,
    request.origin,
  ].join("\n");
}

export function paymentLinkText(request: StayRequest, origin: string): string {
  const villa = getVilla(request.villaId);
  const until = request.holdExpiresAt
    ? format(parseISO(request.holdExpiresAt), "HH:mm d/M")
    : "";
  const plan = paymentPlanLabel(request.total, request.checkIn, request.createdAt);
  return [
    `Stayora · giữ chỗ ${villa?.name ?? ""}`,
    `${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách`,
    `Tổng ${formatVnd(request.total)} · ${plan}`,
    until ? `Giữ đến ${until}` : "",
    `${origin}/requests/${request.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function holdCountdown(holdExpiresAt: string, now: Date): string {
  const ms = parseISO(holdExpiresAt).getTime() - now.getTime();
  if (ms <= 0) return "Đã hết hạn giữ chỗ";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours} giờ ${minutes} phút`;
}

export function requestStatusVi(status: RequestStatus): string {
  switch (status) {
    case "PENDING":
      return "Chờ Host";
    case "ACCEPTED":
      return "Đang giữ chỗ";
    case "DECLINED":
      return "Từ chối";
    case "EXPIRED":
      return "Hết hạn";
    case "CONFLICTED":
      return "Trùng lịch";
  }
}

export function commissionStatusVi(status: CommissionStatus): string {
  if (status === "EARNED") return "Đã đạt";
  if (status === "VOID") return "Không tính";
  return "Chờ";
}

export function refundReasonVi(reason: string): string {
  switch (reason) {
    case "HOLD_EXPIRED":
      return "Hết hạn giữ chỗ";
    case "DUPLICATE_PAYMENT":
      return "Thanh toán trùng";
    case "INVENTORY_CONFLICT":
      return "Xung đột lịch";
    case "CONFLICT_RESOLUTION":
      return "Giải quyết xung đột";
    case "BOOKING_CANCELLED":
      return "Booking đã huỷ";
    default:
      return reason;
  }
}

export function domainMessageVi(error: unknown): string {
  if (error instanceof DomainError) {
    switch (error.code) {
      case "NOT_AVAILABLE":
        return "Villa không trống cho ngày này";
      case "BOOKING_REMAINS":
        return "Đặt chỗ hiện có vẫn giữ. Chưa ghi bảo trì.";
      case "TOO_MANY_GUESTS":
        return "Vượt sức chứa của villa";
      case "FORBIDDEN":
        return "Không có quyền thực hiện";
      case "INVALID_TRANSITION":
        return "Không thể chuyển trạng thái này";
      case "MISSING_REASON":
        return "Cần nêu lý do";
      case "NOT_ASSIGNED":
        return "Villa này không thuộc butler đang đăng nhập";
      case "NOT_FOUND":
        return "Không tìm thấy";
      case "HOLD_EXPIRED":
        return "Hết thời gian giữ phòng — cần xử lý hoàn tiền";
      case "ATTEMPT_UNRESOLVED":
        return "Chưa xác định được kết quả thanh toán. Đừng thanh toán lại.";
      case "NO_BOOKING_YET":
        return "Chưa có booking — không ghi phần còn lại";
      case "STAY_IN_PROGRESS":
        return "Khách đang lưu trú — không thể kết thúc commitment này";
      case "STILL_OVERLAPPING":
        return "Vẫn còn chỗ chồng lịch — chọn commitment khác";
      case "CONCURRENT_CHANGE":
        return "Có người vừa thay đổi — thử lại";
      default:
        return error.message;
    }
  }
  return "Không thực hiện được";
}

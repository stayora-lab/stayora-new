import { format, parseISO } from "date-fns";
import { getVilla } from "../villas.ts";
import { paymentRuleLabel } from "./catalog.ts";
import { DomainError } from "./types.ts";
import type { CommissionStatus, RequestStatus, StayRequest } from "./types.ts";

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

export function quoteText(request: {
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  paymentRule: StayRequest["paymentRule"];
  origin: string;
}): string {
  const villa = getVilla(request.villaId);
  const name = villa?.name ?? request.villaId;
  const sleeps = villa?.sleeps ?? "";
  return [
    `${name} · Oceanami`,
    `${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách · ngủ ${sleeps}`,
    `${formatVnd(request.total)} (giá công khai)`,
    `Thanh toán ${paymentRuleLabel(request.paymentRule)}`,
    request.origin,
  ].join("\n");
}

export function paymentLinkText(request: StayRequest, origin: string): string {
  const villa = getVilla(request.villaId);
  const until = request.holdExpiresAt
    ? format(parseISO(request.holdExpiresAt), "HH:mm d/M")
    : "";
  return [
    `Stayora · giữ chỗ ${villa?.name ?? ""}`,
    `${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách`,
    `Tổng ${formatVnd(request.total)} · ${paymentRuleLabel(request.paymentRule)}`,
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
    case "CONFIRMED":
      return "Đã xác nhận";
    case "DECLINED":
      return "Từ chối";
    case "EXPIRED":
      return "Hết hạn";
  }
}

export function commissionStatusVi(status: CommissionStatus): string {
  return status === "EARNED" ? "Đã đạt" : "Chờ";
}

export function domainMessageVi(error: unknown): string {
  if (error instanceof DomainError) {
    switch (error.code) {
      case "NOT_AVAILABLE":
        return "Villa không trống cho ngày này";
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
      default:
        return error.message;
    }
  }
  return "Không thực hiện được";
}

import { d as format, i as parseISO } from "../_libs/date-fns.mjs";
import { C as paymentPlanLabel, i as DomainError, m as getVilla, o as TIMEZONE } from "./store-3ftKWuoz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/copy-C0l3pdbk.js
function formatVnd(amount) {
	return `₫${amount.toLocaleString("en-US")}`;
}
function viDateRange(checkIn, checkOut) {
	const start = parseISO(checkIn);
	const end = parseISO(checkOut);
	if (start.getMonth() === end.getMonth()) return `${format(start, "d")}–${format(end, "d/M/yyyy")}`;
	return `${format(start, "d/M")}–${format(end, "d/M/yyyy")}`;
}
function formatDueAt(iso) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: TIMEZONE,
		hour: "2-digit",
		minute: "2-digit",
		day: "numeric",
		month: "numeric",
		year: "numeric",
		hour12: false
	}).formatToParts(parseISO(iso));
	const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
	return `${get("hour")}:${get("minute")} ${get("day")}/${get("month")}/${get("year")}`;
}
function balanceLine(obligation, paid) {
	if (paid) return "Đã thanh toán đủ";
	return `Còn lại ${formatVnd(obligation.amount)} — hạn ${formatDueAt(obligation.dueAt)}`;
}
function quoteText(request) {
	const villa = getVilla(request.villaId);
	const name = villa?.name ?? request.villaId;
	const sleeps = villa?.sleeps ?? "";
	return [
		`${name} · Oceanami`,
		`${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách · ngủ ${sleeps}`,
		`${formatVnd(request.total)} (giá công khai)`,
		`Thanh toán ${request.paymentLabel}`,
		request.origin
	].join("\n");
}
function paymentLinkText(request, origin) {
	const villa = getVilla(request.villaId);
	const until = request.holdExpiresAt ? format(parseISO(request.holdExpiresAt), "HH:mm d/M") : "";
	const plan = paymentPlanLabel(request.total, request.checkIn, request.createdAt);
	return [
		`Stayora · giữ chỗ ${villa?.name ?? ""}`,
		`${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách`,
		`Tổng ${formatVnd(request.total)} · ${plan}`,
		until ? `Giữ đến ${until}` : "",
		`${origin}/requests/${request.id}`
	].filter(Boolean).join("\n");
}
function holdCountdown(holdExpiresAt, now) {
	const ms = parseISO(holdExpiresAt).getTime() - now.getTime();
	if (ms <= 0) return "Đã hết hạn giữ chỗ";
	return `${Math.floor(ms / 36e5)} giờ ${Math.floor(ms % 36e5 / 6e4)} phút`;
}
function requestStatusVi(status) {
	switch (status) {
		case "PENDING": return "Chờ Host";
		case "ACCEPTED": return "Đang giữ chỗ";
		case "DECLINED": return "Từ chối";
		case "EXPIRED": return "Hết hạn";
		case "CONFLICTED": return "Trùng lịch";
	}
}
function commissionStatusVi(status) {
	return status === "EARNED" ? "Đã đạt" : "Chờ";
}
function domainMessageVi(error) {
	if (error instanceof DomainError) switch (error.code) {
		case "NOT_AVAILABLE": return "Villa không trống cho ngày này";
		case "TOO_MANY_GUESTS": return "Vượt sức chứa của villa";
		case "FORBIDDEN": return "Không có quyền thực hiện";
		case "INVALID_TRANSITION": return "Không thể chuyển trạng thái này";
		case "MISSING_REASON": return "Cần nêu lý do";
		case "NOT_ASSIGNED": return "Villa này không thuộc butler đang đăng nhập";
		case "NOT_FOUND": return "Không tìm thấy";
		case "HOLD_EXPIRED": return "Hết thời gian giữ phòng — cần xử lý hoàn tiền";
		case "ATTEMPT_UNRESOLVED": return "Chưa xác định được kết quả thanh toán. Đừng thanh toán lại.";
		case "NO_BOOKING_YET": return "Chưa có booking — không ghi phần còn lại";
		default: return error.message;
	}
	return "Không thực hiện được";
}
//#endregion
export { paymentLinkText as a, viDateRange as c, holdCountdown as i, commissionStatusVi as n, quoteText as o, domainMessageVi as r, requestStatusVi as s, balanceLine as t };

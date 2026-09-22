import { d as format, i as parseISO } from "../_libs/date-fns.mjs";
import { S as paymentRuleLabel, i as DomainError, m as getVilla } from "./store-DTEBiuLL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/copy-CmdC2Qzr.js
function formatVnd(amount) {
	return `₫${amount.toLocaleString("en-US")}`;
}
function viDateRange(checkIn, checkOut) {
	const start = parseISO(checkIn);
	const end = parseISO(checkOut);
	if (start.getMonth() === end.getMonth()) return `${format(start, "d")}–${format(end, "d/M/yyyy")}`;
	return `${format(start, "d/M")}–${format(end, "d/M/yyyy")}`;
}
function quoteText(request) {
	const villa = getVilla(request.villaId);
	const name = villa?.name ?? request.villaId;
	const sleeps = villa?.sleeps ?? "";
	return [
		`${name} · Oceanami`,
		`${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách · ngủ ${sleeps}`,
		`${formatVnd(request.total)} (giá công khai)`,
		`Thanh toán ${paymentRuleLabel(request.paymentRule)}`,
		request.origin
	].join("\n");
}
function paymentLinkText(request, origin) {
	const villa = getVilla(request.villaId);
	const until = request.holdExpiresAt ? format(parseISO(request.holdExpiresAt), "HH:mm d/M") : "";
	return [
		`Stayora · giữ chỗ ${villa?.name ?? ""}`,
		`${viDateRange(request.checkIn, request.checkOut)} · ${request.guests} khách`,
		`Tổng ${formatVnd(request.total)} · ${paymentRuleLabel(request.paymentRule)}`,
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
		case "CONFIRMED": return "Đã xác nhận";
		case "DECLINED": return "Từ chối";
		case "EXPIRED": return "Hết hạn";
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
		default: return error.message;
	}
	return "Không thực hiện được";
}
//#endregion
export { quoteText as a, paymentLinkText as i, domainMessageVi as n, requestStatusVi as o, holdCountdown as r, viDateRange as s, commissionStatusVi as t };

import { i as parseISO } from "../_libs/date-fns.mjs";
import { C as paymentPlanLabel, T as useBookingStore, b as obligationSucceeded, m as getVilla, p as formatVnd } from "./store-3ftKWuoz.mjs";
import { i as holdCountdown, t as balanceLine } from "./copy-C0l3pdbk.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DGbrtzc2.mjs";
import { b as Check, g as Clock } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Route$2 } from "./router-CKj4Guo9.mjs";
import { t as StaySummary } from "./stay-summary-BP5JdeeZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/requests._requestId-C8ma-EXg.js
var import_jsx_runtime = require_jsx_runtime();
function RequestPage() {
	const { requestId } = Route$2.useParams();
	const navigate = useNavigate();
	const hydrated = useBookingStore((state) => state.hydrated);
	const world = useBookingStore((state) => state.world);
	const request = world.requests.find((item) => item.id === requestId);
	const booking = world.bookings.find((item) => item.requestId === requestId);
	const stay = booking ? world.stays.find((item) => item.id === booking.stayId) : void 0;
	const initial = world.obligations.find((item) => item.requestId === requestId && item.kind === "INITIAL");
	const balance = world.obligations.find((item) => item.requestId === requestId && item.kind === "BALANCE");
	const unknown = world.attempts.find((item) => item.obligationId === initial?.id && item.status === "UNKNOWN");
	const balancePaid = balance ? obligationSucceeded(world, balance.id) : false;
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-lg px-4 py-24 text-muted",
		children: "Đang mở yêu cầu…"
	});
	if (!request) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-title",
				children: "Không tìm thấy yêu cầu này"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-ink-soft",
				children: "Có thể đây là phiên khác trên thiết bị này."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "Xem villa Oceanami"
				})
			})
		]
	});
	const villa = getVilla(request.villaId);
	if (!villa) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-serif text-title",
			children: "Villa này không còn được niêm yết"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Xem villa Oceanami"
			})
		})]
	});
	if (booking && stay) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 py-12 sm:py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-12 items-center justify-center rounded-full bg-lotus-soft text-lotus",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs font-semibold tracking-wider text-lotus uppercase",
				children: "Đã xác nhận"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-serif text-title",
				children: "Kỳ nghỉ của bạn đã được xác nhận"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-ink-soft",
				children: [
					villa.name,
					" đã được giữ cho ",
					request.guests,
					" khách."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted",
				children: ["Mã xác nhận ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-ink",
					children: booking.reference
				})]
			}),
			balance ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `mt-4 text-sm ${balancePaid ? "text-ink-soft" : "text-lotus-deep"}`,
				children: balanceLine(balance, balancePaid)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaySummary, {
					villa,
					request,
					totalLabel: "Tổng kỳ nghỉ"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "Bước tiếp theo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm text-ink-soft",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Hướng dẫn nhận phòng sẽ được gửi trước ngày đến." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Mở kỳ nghỉ để xem hướng dẫn villa." })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					className: "w-full",
					onClick: () => navigate({
						to: "/your-stay/$stayId",
						params: { stayId: stay.id }
					}),
					children: "Mở kỳ nghỉ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "ghost",
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/villas/$villaId",
						params: { villaId: villa.id },
						children: "Quay lại villa"
					})
				})]
			})
		]
	});
	const clock = parseISO(world.now);
	const plan = paymentPlanLabel(request.total, request.checkIn, request.createdAt);
	const waitingCopy = request.status === "EXPIRED" ? "Hết thời gian giữ phòng." : request.status === "CONFLICTED" ? "Villa không còn trống cho ngày này." : request.status === "DECLINED" ? "Chủ nhà đã từ chối yêu cầu này." : request.status === "ACCEPTED" ? "Chủ nhà đã giữ chỗ. Đây chưa phải kỳ nghỉ đã xác nhận." : "Chủ nhà sẽ xem và phản hồi. Đây chưa phải kỳ nghỉ đã xác nhận.";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 py-12 sm:py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-12 items-center justify-center rounded-full bg-cream-deep text-ink",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs font-semibold tracking-wider text-muted uppercase",
				children: "Đã gửi yêu cầu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-serif text-title",
				children: "Đã gửi yêu cầu của bạn"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-ink-soft",
				children: waitingCopy
			}),
			unknown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 rounded-2xl bg-lotus-soft p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium text-lotus-deep",
					children: "Chưa xác định được kết quả thanh toán. Đừng thanh toán lại."
				})
			}) : null,
			request.status === "ACCEPTED" && initial && !unknown ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wider text-muted uppercase",
						children: "Số tiền cần thanh toán"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-serif text-3xl tabular-nums",
						children: formatVnd(initial.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [plan, request.holdExpiresAt ? ` · giữ còn ${holdCountdown(request.holdExpiresAt, clock)}` : ""]
					}),
					balance ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-lotus-deep",
						children: balanceLine(balance, false)
					}) : null
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaySummary, {
					villa,
					request,
					totalLabel: "Tổng kỳ nghỉ"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-8 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						done: true,
						title: "Đã gửi yêu cầu",
						body: "Chủ nhà đã nhận ngày và số khách."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						current: request.status === "PENDING" || request.status === "ACCEPTED",
						title: "Chờ phản hồi",
						body: "Chủ nhà sẽ xem và phản hồi. Đây chưa phải kỳ nghỉ đã xác nhận."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						title: "Kỳ nghỉ của bạn",
						body: "Sau khi thanh toán thành công, bạn có thể mở hướng dẫn lưu trú."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "ghost",
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/villas/$villaId",
						params: { villaId: villa.id },
						children: "Quay lại villa"
					})
				})
			})
		]
	});
}
function Step({ title, body, done, current }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `mt-1 size-2.5 shrink-0 rounded-full ${done ? "bg-lotus" : current ? "bg-ink" : "bg-sand"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: body
		})] })]
	});
}
//#endregion
export { RequestPage as component };

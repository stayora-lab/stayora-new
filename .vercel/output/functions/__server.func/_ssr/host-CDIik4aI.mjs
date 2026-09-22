import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { i as parseISO } from "../_libs/date-fns.mjs";
import { C as paymentPlanLabel, T as useBookingStore, b as obligationSucceeded, m as getVilla, p as formatVnd } from "./store-3ftKWuoz.mjs";
import { c as viDateRange, i as holdCountdown, r as domainMessageVi, s as requestStatusVi, t as balanceLine } from "./copy-C0l3pdbk.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-DGbrtzc2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/host-CDIik4aI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEMO_PAY_LABEL = "Ghi nhận thanh toán (demo — sau này do Stayora xác minh)";
function HostPage() {
	const persona = useBookingStore((state) => state.persona);
	const setPersona = useBookingStore((state) => state.setPersona);
	const world = useBookingStore((state) => state.world);
	const hostAccept = useBookingStore((state) => state.hostAccept);
	const hostRecordPayment = useBookingStore((state) => state.hostRecordPayment);
	const hostResolveUnknown = useBookingStore((state) => state.hostResolveUnknown);
	const advanceDemo = useBookingStore((state) => state.advanceDemo);
	const [error, setError] = (0, import_react.useState)(null);
	const clock = parseISO(world.now);
	const refundCases = world.refundCases ?? [];
	(0, import_react.useEffect)(() => {
		if (persona !== "HOST") setPersona("HOST");
	}, [persona, setPersona]);
	const pending = world.requests.filter((item) => item.status === "PENDING");
	const holding = world.requests.filter((item) => item.status === "ACCEPTED" && !world.bookings.some((booking) => booking.requestId === item.id));
	const bookedRequests = world.requests.filter((item) => world.bookings.some((booking) => booking.requestId === item.id));
	const occupancyBookings = world.bookings.filter((booking) => !world.requests.some((request) => request.id === booking.requestId));
	const openRefunds = refundCases.filter((item) => item.status === "OPEN");
	function run(action) {
		setError(null);
		try {
			action();
		} catch (err) {
			setError(domainMessageVi(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 pt-6 pb-20 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wider text-lotus uppercase",
				children: "Host · Oceanami"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-serif text-title",
				children: "Yêu cầu cần xử lý"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "Chỉ Host chấp nhận. Thanh toán được ghi nhận tại đây — khách không tự xác nhận."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "w-full",
					onClick: () => run(() => advanceDemo()),
					children: "Tua nhanh 30 phút"
				})
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-lotus-deep",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Chờ chấp nhận",
				count: pending.length,
				empty: "Không có yêu cầu mới.",
				children: pending.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
					request,
					clock,
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: () => run(() => hostAccept(request.id)),
						children: "Chấp nhận · giữ 30 phút"
					})
				}, request.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Đang giữ chỗ",
				count: holding.length,
				empty: "Không có chỗ đang giữ.",
				children: holding.map((request) => {
					const initial = world.obligations.find((item) => item.requestId === request.id && item.kind === "INITIAL");
					const unknown = world.attempts.find((item) => item.obligationId === initial?.id && item.status === "UNKNOWN");
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
						request,
						clock,
						extra: initial ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm",
							children: ["Cần thu ", formatVnd(initial.amount)]
						}) : null,
						action: unknown && initial ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResolveUnknown, { onResolve: (outcome) => run(() => hostResolveUnknown(unknown.id, outcome)) }) : initial ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentButtons, { onRecord: (outcome) => run(() => hostRecordPayment(initial.id, outcome)) }) : null
					}, request.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
				title: "Đã xác nhận",
				count: bookedRequests.length + occupancyBookings.length,
				empty: "Chưa có booking.",
				children: [bookedRequests.map((request) => {
					const balance = world.obligations.find((item) => item.requestId === request.id && item.kind === "BALANCE");
					const unknown = world.attempts.find((item) => item.obligationId === balance?.id && item.status === "UNKNOWN");
					const paid = balance ? obligationSucceeded(world, balance.id) : false;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
						request,
						clock,
						booked: true,
						extra: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: [
								"Mã",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-ink",
									children: world.bookings.find((item) => item.requestId === request.id)?.reference
								})
							]
						}), balance ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BalanceStatus, {
							obligation: balance,
							paid
						}) : null] }),
						action: !balance ? null : unknown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResolveUnknown, { onResolve: (outcome) => run(() => hostResolveUnknown(unknown.id, outcome)) }) : paid ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentButtons, { onRecord: (outcome) => run(() => hostRecordPayment(balance.id, outcome)) })
					}, request.id);
				}), occupancyBookings.map((booking) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: getVilla(booking.villaId)?.name ?? booking.villaId
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-ink-soft",
							children: booking.guestName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: [
								viDateRange(booking.checkIn, booking.checkOut),
								" · ",
								booking.guests,
								" khách"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: ["Mã ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-ink",
								children: booking.reference
							})]
						})
					]
				}, booking.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Cần hoàn tiền",
				count: openRefunds.length,
				empty: "Không có khoản cần hoàn.",
				children: openRefunds.map((refund) => {
					const request = world.requests.find((item) => item.id === refund.requestId);
					const villa = request ? getVilla(request.villaId) : void 0;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: villa?.name ?? request?.villaId ?? refund.requestId
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-ink-soft",
									children: request?.guestName ?? "Khách"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep",
									children: "Mở"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 font-semibold tabular-nums",
								children: formatVnd(refund.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "Hết hạn giữ chỗ"
							})
						]
					}, refund.id);
				})
			})
		]
	});
}
function BalanceStatus({ obligation, paid }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: `mt-3 text-sm ${paid ? "text-ink-soft" : "text-lotus-deep"}`,
		children: balanceLine(obligation, paid)
	});
}
function PaymentButtons({ onRecord }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wider text-muted uppercase",
				children: "Kết quả thanh toán"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: DEMO_PAY_LABEL
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					["SUCCEEDED", "Thành công"],
					["FAILED", "Thất bại"],
					["UNKNOWN", "Không xác định"]
				].map(([outcome, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: outcome === "SUCCEEDED" ? "primary" : "outline",
					className: "h-11 px-2 text-xs",
					onClick: () => onRecord(outcome),
					children: label
				}, outcome))
			})
		]
	});
}
function ResolveUnknown({ onResolve }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-lotus-deep",
				children: "Chưa xác định được kết quả thanh toán. Đừng thanh toán lại."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wider text-muted uppercase",
				children: "Gỡ không xác định"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: DEMO_PAY_LABEL
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "w-full",
					onClick: () => onResolve("SUCCEEDED"),
					children: "Thành công"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					className: "w-full",
					onClick: () => onResolve("FAILED"),
					children: "Thất bại"
				})]
			})
		]
	});
}
function Section({ title, count, empty, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "pt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: count
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-3",
			children: count === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]",
				children: empty
			}) : children
		})]
	});
}
function RequestCard({ request, clock, action, extra, booked }) {
	const villa = getVilla(request.villaId);
	const source = request.source === "SALE" ? "Sale · Mai" : "Khách trực tiếp";
	const plan = paymentPlanLabel(request.total, request.checkIn, request.createdAt);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: villa?.name ?? request.villaId
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-ink-soft",
					children: request.guestName
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep",
					children: booked ? "Đã xác nhận" : requestStatusVi(request.status)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted",
				children: [
					viDateRange(request.checkIn, request.checkOut),
					" · ",
					request.guests,
					" khách"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold tabular-nums",
					children: formatVnd(request.total)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted",
					children: [" · ", plan]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs font-medium tracking-wide text-ink-soft uppercase",
				children: source
			}),
			!booked && request.status === "ACCEPTED" && request.holdExpiresAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-lotus-deep",
				children: ["Giữ còn ", holdCountdown(request.holdExpiresAt, clock)]
			}) : null,
			extra,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: action
			}) : null
		]
	});
}
//#endregion
export { HostPage as component };

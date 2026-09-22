import { d as format, i as parseISO, t as vi } from "../_libs/date-fns.mjs";
import { D as useBookingStore, E as stayGuestLabel, S as obligationSucceeded, h as getVilla, r as DESTINATION } from "./store-Eq8rYrIv.mjs";
import { t as balanceLine } from "./copy-DhNapS8c.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-CdPly7rM.mjs";
import { v as Link, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route } from "./router-DHetFYW_.mjs";
import { t as Photo } from "./photo-0DRkc02K.mjs";
import { t as StaySummary } from "./stay-summary-CfBs17as.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/your-stay._stayId-BkICwrQp.js
var import_jsx_runtime = require_jsx_runtime();
function formatViDate(iso) {
	return format(parseISO(iso), "EEEE d/M/yyyy", { locale: vi });
}
function YourStayPage() {
	const { stayId } = Route.useParams();
	const hydrated = useBookingStore((state) => state.hydrated);
	const world = useBookingStore((state) => state.world);
	const stay = world.stays.find((item) => item.id === stayId);
	const booking = world.bookings.find((item) => item.stayId === stayId);
	const request = booking ? world.requests.find((item) => item.id === booking.requestId) : void 0;
	const balance = request ? world.obligations.find((item) => item.requestId === request.id && item.kind === "BALANCE") : void 0;
	const balancePaid = balance ? obligationSucceeded(world, balance.id) : false;
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-3xl px-4 py-24 text-muted",
		children: "Đang mở kỳ nghỉ…"
	});
	if (!stay && request) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/requests/$requestId",
		params: { requestId: request.id }
	});
	if (!stay) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-serif text-title",
			children: "Không tìm thấy kỳ nghỉ này"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Xem villa Oceanami"
			})
		})]
	});
	const villa = getVilla(stay.villaId);
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
	const hero = villa.images[0];
	const summary = request ?? {
		checkIn: stay.checkIn,
		checkOut: stay.checkOut,
		guests: stay.guests,
		nights: booking?.nights ?? 0,
		total: booking?.total ?? 0
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "pb-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-72 overflow-hidden sm:h-96",
			children: [
				hero ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
					src: hero.src,
					alt: "Ảnh minh hoạ"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-t from-ink/65 via-ink/10 to-transparent" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-8 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-[0.16em] text-cream/80 uppercase",
						children: "Kỳ nghỉ của bạn · Oceanami"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-serif text-title text-cream",
						children: villa.name
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-4xl px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "-mt-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaySummary, {
						villa,
						request: summary,
						totalLabel: "Tổng kỳ nghỉ"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 flex flex-wrap items-center gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-lotus-soft px-3 py-1 font-medium text-lotus-deep",
						children: stayGuestLabel(stay.status)
					}), booking?.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: ["Mã xác nhận ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-ink",
							children: booking.reference
						})]
					}) : null]
				}),
				balance ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `mt-4 text-sm ${balancePaid ? "text-ink-soft" : "text-lotus-deep"}`,
					children: balanceLine(balance, balancePaid)
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 grid gap-4 md:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "Nhận phòng",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: formatViDate(stay.checkIn) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm text-muted",
								children: [
									"Hướng dẫn nhận phòng sẽ được gửi trước ngày đến. ",
									stay.guests,
									" khách."
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "Trả phòng",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: formatViDate(stay.checkOut) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Chi tiết trả phòng sẽ được gửi cùng hướng dẫn nhận phòng."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "Villa",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									villa.bedrooms,
									" phòng ngủ · ngủ ",
									villa.sleeps,
									" · hồ bơi riêng"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted",
									children: villa.summary
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/villas/$villaId",
									params: { villaId: villa.id },
									className: "mt-4 inline-block text-sm font-medium text-lotus hover:text-lotus-deep",
									children: "Xem villa"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "Đường đến",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: DESTINATION.address }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Khoảng 2,5 giờ từ TP. Hồ Chí Minh."
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-6 rounded-2xl bg-cream-deep/70 p-6 sm:p-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-2xl text-ink-soft",
						children: "Hướng dẫn nhận phòng sẽ được gửi trước ngày đến."
					})
				})
			]
		})]
	});
}
function StayCard({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl bg-paper p-6 shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 text-ink-soft",
			children
		})]
	});
}
//#endregion
export { YourStayPage as component };

import { C as stayGuestLabel, f as formatLongDate, h as guestLabel, m as getVilla, r as DESTINATION, w as useBookingStore } from "./store-CN_mVyeU.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-B_fynA1P.mjs";
import { v as Link, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route } from "./router-7ElQh_kK.mjs";
import { t as Photo } from "./photo-jLMTizco.mjs";
import { t as StaySummary } from "./stay-summary-DQtD5kPe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/your-stay._stayId-Cs12O4cc.js
var import_jsx_runtime = require_jsx_runtime();
function YourStayPage() {
	const { stayId } = Route.useParams();
	const hydrated = useBookingStore((state) => state.hydrated);
	const world = useBookingStore((state) => state.world);
	const stay = world.stays.find((item) => item.id === stayId);
	const booking = world.bookings.find((item) => item.stayId === stayId);
	const request = booking ? world.requests.find((item) => item.id === booking.requestId) : void 0;
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-3xl px-4 py-24 text-muted",
		children: "Opening your stay…"
	});
	if (!stay && request) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/requests/$requestId",
		params: { requestId: request.id }
	});
	if (!stay) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-serif text-title",
			children: "We can't find that stay"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Browse Oceanami"
			})
		})]
	});
	const villa = getVilla(stay.villaId);
	if (!villa) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-serif text-title",
			children: "This stay is no longer listed"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Browse Oceanami"
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
						children: "Your stay · Oceanami"
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
						request: summary
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 flex flex-wrap items-center gap-3 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-lotus-soft px-3 py-1 font-medium text-lotus-deep",
						children: stayGuestLabel(stay.status)
					}), booking?.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: ["Confirmation ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-ink",
							children: booking.reference
						})]
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 grid gap-4 md:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "Arrival",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: formatLongDate(stay.checkIn) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm text-muted",
								children: [
									"Arrival notes will be shared before the stay. ",
									guestLabel(stay.guests),
									" are expected."
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "Departure",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: formatLongDate(stay.checkOut) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Departure details will be shared with your arrival notes."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "The villa",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									villa.bedrooms,
									" bedrooms · ",
									guestLabel(villa.sleeps),
									" · private pool"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted",
									children: villa.summary
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/villas/$villaId",
									params: { villaId: villa.id },
									className: "mt-4 inline-block text-sm font-medium text-lotus hover:text-lotus-deep",
									children: "View the villa"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StayCard, {
							title: "Getting here",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: DESTINATION.address }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm text-muted",
								children: [DESTINATION.travel, "."]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)] md:grid md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative h-52 md:h-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
							src: "/images/beach-club.jpg",
							alt: "Ảnh minh hoạ"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-6 sm:p-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-wider text-lotus uppercase",
								children: "While you're here"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-2 font-serif text-2xl",
								children: "Beach club, spa, and the house kitchen"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-ink-soft",
								children: "Your stay includes the villa and access to the Oceanami beach club. A fuller guide will sit here before arrival — this is the doorway into it."
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6 rounded-2xl bg-cream-deep/70 p-6 sm:p-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: "Need a hand"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-2xl text-ink-soft",
						children: "The Stayora team will be in touch before you arrive. For around the grounds, the destination team at Oceanami looks after guests on site."
					})]
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

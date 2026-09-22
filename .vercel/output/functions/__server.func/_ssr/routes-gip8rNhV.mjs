import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as villas, c as bookabilityCopy, h as guestLabel, o as bedroomLabel, p as formatVnd, r as DESTINATION, s as bookability, w as useBookingStore } from "./store-CN_mVyeU.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-B_fynA1P.mjs";
import { i as GuestField, n as DateRangeField, r as FieldSplit } from "./dates-guests-BRl-HRjS.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Route$6, o as StayoraIcon } from "./router-7ElQh_kK.mjs";
import { t as Photo } from "./photo-jLMTizco.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-gip8rNhV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VillaCard({ villa, checkIn, checkOut, guests }) {
	const world = useBookingStore((state) => state.world);
	const result = bookability(villa, checkIn, checkOut, guests, world);
	const hero = villa.images[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/villas/$villaId",
		params: { villaId: villa.id },
		search: {
			checkIn,
			checkOut,
			guests
		},
		className: "group block",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-200 ease-out hover:shadow-[var(--shadow-border-hover)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-photo overflow-hidden",
				children: [
					hero ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
						src: hero.src,
						alt: "Ảnh minh hoạ",
						className: "transition-transform duration-500 ease-out group-hover:scale-[1.03]"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-3 left-3 rounded-full bg-paper/92 px-3 py-1 text-xs font-medium",
						children: villa.settingLabel
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute right-3 bottom-3 rounded-full bg-paper/92 px-2.5 py-1 text-[11px] text-muted",
						children: "Ảnh minh hoạ"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-medium",
							children: villa.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Oceanami · Phước Hải"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted",
							children: "Chưa có đánh giá"
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-ink-soft",
						children: [
							bedroomLabel(villa.bedrooms),
							" · ",
							guestLabel(villa.sleeps)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold tabular-nums",
								children: formatVnd(villa.nightly)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: " / night"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: bookabilityCopy(result)
						})]
					})
				]
			})]
		})
	});
}
var FILTERS = [
	{
		id: "all",
		label: "All stays"
	},
	{
		id: "beachfront",
		label: "By the sea"
	},
	{
		id: "garden",
		label: "Garden"
	},
	{
		id: "hillside",
		label: "Hillside"
	},
	{
		id: "family",
		label: "Sleeps 6+"
	}
];
function MarketplacePage() {
	const search = Route$6.useSearch();
	const stored = useBookingStore((state) => state.search);
	const setSearch = useBookingStore((state) => state.setSearch);
	const navigate = useNavigate({ from: "/" });
	const [filter, setFilter] = (0, import_react.useState)("all");
	const checkIn = search.checkIn ?? stored.checkIn ?? "2026-10-16";
	const checkOut = search.checkOut ?? stored.checkOut ?? "2026-10-19";
	const guests = search.guests ?? stored.guests ?? 4;
	function update(next) {
		const merged = {
			checkIn,
			checkOut,
			guests,
			...next
		};
		setSearch(merged);
		navigate({
			search: merged,
			replace: true
		});
	}
	const visible = (0, import_react.useMemo)(() => {
		return villas.filter((villa) => {
			if (filter === "family") return villa.sleeps >= 6;
			if (filter === "all") return true;
			return villa.setting === filter;
		});
	}, [filter]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-[72vh] min-h-100 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
						src: "/images/oceanami-hero.jpg",
						alt: "Ảnh minh hoạ"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-t from-ink/70 via-ink/20 to-ink/10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-28",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayoraIcon, { className: "mb-5 h-11 text-cream" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium tracking-[0.18em] text-cream/80 uppercase",
								children: DESTINATION.region
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-3 font-serif text-display text-cream italic",
								children: "Oceanami"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 max-w-xl text-lead text-cream/90",
								children: "Private villas between the East Sea and Minh Đạm mountain."
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative z-10 mx-auto -mt-10 max-w-4xl px-4 sm:-mt-12 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "flex flex-col gap-2 rounded-2xl bg-paper p-2 shadow-[var(--shadow-lift)] md:flex-row md:items-center md:rounded-full md:p-1.5",
					onSubmit: (event) => {
						event.preventDefault();
						document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" });
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldSplit, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateRangeField, {
						checkIn,
						checkOut,
						onChange: (next) => update(next)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuestField, {
						guests,
						onChange: (value) => update({ guests: value })
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "lg",
						className: "md:mr-1 md:px-8",
						children: "Show stays"
					})]
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-10 lg:grid-cols-2 lg:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold tracking-wider text-lotus uppercase",
					children: "The destination"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-3 font-serif text-title",
					children: "A beach, a mountain, and a handful of houses."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lead text-ink-soft",
					children: DESTINATION.intro
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-10 grid gap-6 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs font-semibold tracking-wider text-muted uppercase",
						children: "From the city"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-2 text-ink-soft",
						children: DESTINATION.travel
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs font-semibold tracking-wider text-muted uppercase",
						children: "The shore"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-2 text-ink-soft",
						children: "Phước Hải beach, on the East Sea."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs font-semibold tracking-wider text-muted uppercase",
						children: "Behind the villas"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "mt-2 text-ink-soft",
						children: "Minh Đạm mountain and tropical garden."
					})] })
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto grid max-w-6xl items-stretch gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden rounded-2xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative h-72 lg:h-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
						src: "/images/beach-club.jpg",
						alt: "Ảnh minh hoạ"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute right-3 bottom-3 rounded-full bg-paper/92 px-2.5 py-1 text-[11px] text-muted",
						children: "Ảnh minh hoạ"
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col justify-center rounded-2xl bg-paper p-8 shadow-[var(--shadow-border)] sm:p-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wider text-lotus uppercase",
						children: "Life at Oceanami"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-serif text-title",
						children: "A beach club, a spa, and your own kitchen."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-ink-soft",
						children: "Days here are unscheduled on purpose. Swim from the villa, walk to the club, cook if you want the house to yourselves. Chủ nhà sẽ xem và phản hồi."
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "stays",
			className: "mx-auto max-w-6xl px-4 pb-24 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wider text-lotus uppercase",
						children: "Places to stay"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-2 font-serif text-title",
						children: "Villas at Oceanami"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [visible.length, " homes"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex gap-2 overflow-x-auto pb-2",
					children: FILTERS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setFilter(item.id),
						className: `h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${filter === item.id ? "bg-ink text-cream" : "bg-paper text-ink shadow-[var(--shadow-border)] hover:bg-cream-deep"}`,
						children: item.label
					}, item.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3",
					children: visible.map((villa) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VillaCard, {
						villa,
						checkIn,
						checkOut,
						guests
					}, villa.id))
				})
			]
		})
	] });
}
//#endregion
export { MarketplacePage as component };

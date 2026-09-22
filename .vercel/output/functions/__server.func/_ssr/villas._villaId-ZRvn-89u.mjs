import { o as __toESM } from "../_runtime.mjs";
import { _ as getVilla, n as DESTINATION, t as AMENITY_LABELS } from "./engine-Dt7igvIP.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as DialogOverlay, n as DialogClose, o as DialogPortal, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { _ as CircleParking, a as UtensilsCrossed, c as Sparkles, h as Flower2, i as Waves, l as ShowerHead, n as Wind, p as Laptop, r as Wifi, s as TreePalm, t as X, u as Shirt, x as Bath, y as ChefHat } from "../_libs/lucide-react.mjs";
import { _ as isIsoDate, b as useBookingStore, c as Button, f as cn, g as guestLabel, h as formatVnd, l as bedroomLabel, m as formatDateRange, r as Route$1, u as bookability, v as nightLabel, y as nightsBetween } from "./router-BdOyuEru.mjs";
import { t as Drawer } from "../_libs/vaul.mjs";
import { i as GuestField, n as DateRangeField } from "./dates-guests-oK990JZY.mjs";
import { n as VillaPlaceholder, t as Photo } from "./photo-Da6ENjMQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/villas._villaId-ZRvn-89u.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PriceBlock({ villa, checkIn, checkOut }) {
	const ready = isIsoDate(checkIn) && isIsoDate(checkOut) && nightsBetween(checkIn, checkOut) > 0;
	const nights = ready ? nightsBetween(checkIn, checkOut) : 0;
	const total = nights * villa.nightly;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xl font-semibold tabular-nums",
				children: formatVnd(villa.nightly)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "per night"
			})]
		}), ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2 text-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4 text-ink-soft",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						formatVnd(villa.nightly),
						" × ",
						nightLabel(nights)
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: formatVnd(total)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between gap-4 border-t border-border pt-2 font-medium",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Stay total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: formatVnd(total)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted",
					children: "We'll confirm this total with your stay."
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Add dates to see the stay total."
		})]
	});
}
function BookingForm({ villa, checkIn, checkOut, guests, onDates, onGuests, onRequest, existing }) {
	const world = useBookingStore((state) => state.world);
	const result = bookability(villa, checkIn, checkOut, guests, world);
	const canRequest = result.state === "ready" && !existing;
	let helper = "Your request will be sent for confirmation.";
	if (result.state === "unavailable") helper = "These dates aren't available to request.";
	if (result.state === "too-many-guests") helper = `This villa sleeps up to ${result.sleeps} guests.`;
	if (result.state === "missing-dates") helper = "Choose check-in and check-out to continue.";
	if (existing) helper = "You've already sent a request for these dates.";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriceBlock, {
				villa,
				checkIn,
				checkOut
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateRangeField, {
						villa,
						world,
						checkIn,
						checkOut,
						onChange: onDates,
						className: "rounded-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuestField, {
						guests,
						onChange: onGuests,
						className: "rounded-none"
					})
				]
			}),
			existing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ink",
				size: "lg",
				className: "w-full",
				onClick: existing.onOpen,
				children: existing.label
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				className: "w-full",
				disabled: !canRequest,
				onClick: onRequest,
				children: "Request this stay"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-sm text-muted",
				children: helper
			})
		]
	});
}
function BookingPanel(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: "rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingForm, { ...props })
	});
}
function MobileBookingBar(props) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const ready = isIsoDate(props.checkIn) && isIsoDate(props.checkOut);
	const nights = ready ? nightsBetween(props.checkIn, props.checkOut) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "truncate font-semibold tabular-nums",
					children: [formatVnd(props.villa.nightly), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-1 font-normal text-muted",
						children: "/ night"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-xs text-muted",
					children: ready && nights > 0 ? `${formatDateRange(props.checkIn, props.checkOut)} · ${guestLabel(props.guests)}` : "Add dates"
				})]
			}), props.existing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				variant: "ink",
				className: "px-5",
				onClick: props.existing.onOpen,
				children: props.existing.label
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Root, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Trigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						className: "px-5",
						children: "Request"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
					className: "fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-4 font-serif text-3xl",
							children: ["Request ", props.villa.name]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingForm, { ...props })
					]
				})] })]
			})]
		})
	});
}
var Dialog = Dialog$1;
var DialogTitle = DialogTitle$1;
function DialogContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-ink/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed top-1/2 left-1/2 z-50 w-[min(96vw,72rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-paper p-3 text-ink shadow-[var(--shadow-lift)] outline-none", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			className: "absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-ink/50 text-cream hover:bg-ink/70",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function VillaGallery({ images, name }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [active, setActive] = (0, import_react.useState)(0);
	const hero = images[0];
	const rest = images.slice(1, 5);
	function openAt(index) {
		setActive(index);
		setOpen(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative grid gap-2 md:grid-cols-4 md:grid-rows-2 md:h-[min(62vh,36rem)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => openAt(0),
					className: "relative h-64 overflow-hidden rounded-lg md:col-span-2 md:row-span-2 md:h-full md:rounded-l-2xl md:rounded-r-lg",
					children: hero ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
						src: hero.src,
						alt: "Ảnh minh hoạ"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VillaPlaceholder, { name })
				}),
				rest.map((image, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => openAt(index + 1),
					className: cn("relative hidden overflow-hidden md:block", index === 1 || index === 3 ? "md:rounded-r-2xl" : "rounded-lg", index > 1 && rest.length < 3 ? "md:hidden" : ""),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
						src: image.src,
						alt: "Ảnh minh hoạ"
					})
				}, image.src + index)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => openAt(0),
					className: "absolute right-3 bottom-3 rounded-full bg-paper/95 px-4 py-2 text-sm font-medium shadow-[var(--shadow-border)] md:right-4 md:bottom-4",
					children: "See all photos"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs text-muted",
			children: "Ảnh minh hoạ"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[92vh] overflow-hidden p-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "sr-only",
					children: [name, " photos"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-ink",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative aspect-photo max-h-[70vh] w-full",
							children: images[active] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
								src: images[active].src,
								alt: "Ảnh minh hoạ"
							}) : null
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 pt-2 text-xs text-cream/70",
							children: "Ảnh minh hoạ"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 overflow-x-auto p-3",
							children: images.map((image, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActive(index),
								className: cn("h-16 w-24 shrink-0 overflow-hidden rounded-md", active === index ? "ring-2 ring-cream" : "opacity-70"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
									src: image.src,
									alt: "Ảnh minh hoạ"
								})
							}, image.src))
						})
					]
				})]
			})
		})
	] });
}
var AMENITY_ICONS = {
	pool: Waves,
	wifi: Wifi,
	kitchen: ChefHat,
	beach: TreePalm,
	air: Wind,
	parking: CircleParking,
	bbq: UtensilsCrossed,
	washer: Shirt,
	shower: ShowerHead,
	club: Flower2,
	housekeeping: Sparkles,
	workspace: Laptop,
	baths: Bath
};
function VillaPage() {
	const { villaId } = Route$1.useParams();
	const villa = getVilla(villaId);
	if (!villa) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-xl px-4 py-24 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-title",
				children: "This villa isn't listed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-ink-soft",
				children: "It may have been moved, or the link is incomplete."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "Back to Oceanami"
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VillaDetail, { villa });
}
function VillaDetail({ villa }) {
	const search = Route$1.useSearch();
	const navigate = useNavigate();
	const stored = useBookingStore((state) => state.search);
	const setSearch = useBookingStore((state) => state.setSearch);
	const guestCreateRequest = useBookingStore((state) => state.guestCreateRequest);
	const world = useBookingStore((state) => state.world);
	const requests = world.requests;
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
			to: "/villas/$villaId",
			params: { villaId: villa.id },
			search: merged,
			replace: true
		});
	}
	const existing = requests.find((request) => request.villaId === villa.id && request.checkIn === checkIn && request.checkOut === checkOut);
	const existingBooking = existing ? world.bookings.find((item) => item.requestId === existing.id) : void 0;
	async function requestStay() {
		const { requestId } = await guestCreateRequest({
			villaId: villa.id,
			checkIn,
			checkOut,
			guests
		});
		navigate({
			to: "/requests/$requestId",
			params: { requestId }
		});
	}
	const booking = {
		villa,
		checkIn,
		checkOut,
		guests,
		onDates: (next) => update(next),
		onGuests: (value) => update({ guests: value }),
		onRequest: requestStay,
		existing: existing ? {
			label: existingBooking ? "View your stay" : "View your request",
			onOpen: () => {
				if (existingBooking) navigate({
					to: "/your-stay/$stayId",
					params: { stayId: existingBooking.stayId }
				});
				else navigate({
					to: "/requests/$requestId",
					params: { requestId: existing.id }
				});
			}
		} : void 0
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "pb-28 lg:pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VillaGallery, {
					images: villa.images,
					name: villa.name
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_22rem] lg:items-start lg:py-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "space-y-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-semibold tracking-wider text-lotus uppercase",
								children: ["Oceanami · ", villa.settingLabel]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 font-serif text-title",
								children: villa.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-2xl text-lead text-ink-soft",
								children: villa.tagline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-4 text-sm text-ink-soft",
								children: [
									bedroomLabel(villa.bedrooms),
									" · ",
									villa.bathrooms,
									" bathrooms · ",
									guestLabel(villa.sleeps),
									" · ",
									villa.sqm,
									" m²"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Chưa có đánh giá"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-4 text-ink-soft",
							children: villa.description.map((paragraph) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: paragraph }, paragraph))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-medium",
							children: "Sleeping"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 grid gap-3 sm:grid-cols-2",
							children: villa.sleeping.map((room) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-xl bg-paper p-4 shadow-[var(--shadow-border)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: room.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: room.detail
								})]
							}, room.title))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-medium",
							children: "What the house offers"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2",
							children: villa.amenities.map((id) => {
								const Icon = AMENITY_ICONS[id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-3 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-ink-soft" }), AMENITY_LABELS[id]]
								}, id);
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "grid gap-6 md:grid-cols-2 md:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-medium",
									children: "Where you are"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-ink-soft",
									children: [
										"On the Oceanami grounds in ",
										DESTINATION.region,
										". ",
										DESTINATION.travel,
										". The beach club and spa sit a short walk from the villas."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm text-muted",
									children: DESTINATION.address
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative h-52 overflow-hidden rounded-xl",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
									src: "/images/oceanami-hero.jpg",
									alt: "Ảnh minh hoạ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute right-3 bottom-3 rounded-full bg-paper/92 px-2.5 py-1 text-[11px] text-muted",
									children: "Ảnh minh hoạ"
								})]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden lg:sticky lg:top-24 lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingPanel, { ...booking })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileBookingBar, { ...booking })
		]
	});
}
//#endregion
export { VillaPage as component };

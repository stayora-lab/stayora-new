import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { i as parseISO, t as vi } from "../_libs/date-fns.mjs";
import { S as paymentPlanLabel, T as villas, _ as isIsoDate, a as SALE_MAI, g as isAvailable, p as formatVnd, w as useBookingStore, y as nightsBetween } from "./store-CN_mVyeU.mjs";
import { a as quoteText, i as paymentLinkText, n as domainMessageVi, o as requestStatusVi, r as holdCountdown, s as viDateRange, t as commissionStatusVi } from "./copy-CJYuN2Fk.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-B_fynA1P.mjs";
import { t as Drawer } from "../_libs/vaul.mjs";
import { i as GuestField, n as DateRangeField, r as FieldSplit } from "./dates-guests-BRl-HRjS.mjs";
import { t as Photo } from "./photo-jLMTizco.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sale-PL5EaBcY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function copyText(value) {
	try {
		await navigator.clipboard.writeText(value);
		return true;
	} catch {
		try {
			const area = document.createElement("textarea");
			area.value = value;
			area.setAttribute("readonly", "");
			area.style.position = "fixed";
			area.style.left = "-9999px";
			document.body.appendChild(area);
			area.select();
			const ok = document.execCommand("copy");
			document.body.removeChild(area);
			return ok;
		} catch {
			return false;
		}
	}
}
var TABS = [
	{
		id: "search",
		label: "Tìm villa"
	},
	{
		id: "requests",
		label: "Yêu cầu của tôi"
	},
	{
		id: "income",
		label: "Thu nhập"
	}
];
function SalePage() {
	const persona = useBookingStore((state) => state.persona);
	const setPersona = useBookingStore((state) => state.setPersona);
	const world = useBookingStore((state) => state.world);
	const search = useBookingStore((state) => state.saleSearch);
	const setSaleSearch = useBookingStore((state) => state.setSaleSearch);
	const saleCreateRequest = useBookingStore((state) => state.saleCreateRequest);
	const [tab, setTab] = (0, import_react.useState)("search");
	const [copied, setCopied] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [creating, setCreating] = (0, import_react.useState)(null);
	const [guestName, setGuestName] = (0, import_react.useState)("");
	const clock = parseISO(world.now);
	(0, import_react.useEffect)(() => {
		if (persona !== "SALE") setPersona("SALE");
	}, [persona, setPersona]);
	const ready = isIsoDate(search.checkIn) && isIsoDate(search.checkOut) && nightsBetween(search.checkIn, search.checkOut) >= 1;
	const nights = ready ? nightsBetween(search.checkIn, search.checkOut) : 0;
	const evaluatedAt = world.now;
	const grouped = (0, import_react.useMemo)(() => {
		if (!ready) return {
			open: [],
			closed: villas
		};
		const open = [];
		const closed = [];
		for (const villa of villas) if (isAvailable(world, villa.id, search.checkIn, search.checkOut)) open.push(villa);
		else closed.push(villa);
		return {
			open,
			closed
		};
	}, [
		world,
		search.checkIn,
		search.checkOut,
		ready
	]);
	const myRequests = world.requests.filter((item) => item.saleId === SALE_MAI);
	const myCommissions = world.commissions.filter((item) => item.saleId === SALE_MAI);
	async function copyQuote(villa) {
		if (!ready) return;
		const origin = `${window.location.origin}/villas/${villa.id}`;
		const total = villa.nightly * nights;
		const ok = await copyText(quoteText({
			villaId: villa.id,
			checkIn: search.checkIn,
			checkOut: search.checkOut,
			guests: search.guests,
			total,
			paymentLabel: paymentPlanLabel(total, search.checkIn, evaluatedAt),
			origin
		}));
		setCopied(ok ? `quote-${villa.id}` : null);
		window.setTimeout(() => setCopied(null), 2200);
	}
	async function copyPayment(requestId) {
		const request = world.requests.find((item) => item.id === requestId);
		if (!request) return;
		const ok = await copyText(paymentLinkText(request, window.location.origin));
		setCopied(ok ? `pay-${requestId}` : null);
		window.setTimeout(() => setCopied(null), 2200);
	}
	function submitRequest() {
		if (!creating || !ready) return;
		setError(null);
		try {
			saleCreateRequest({
				villaId: creating.id,
				checkIn: search.checkIn,
				checkOut: search.checkOut,
				guests: search.guests,
				guestName: guestName.trim() || "Khách"
			});
			setCreating(null);
			setGuestName("");
			setTab("requests");
		} catch (err) {
			setError(domainMessageVi(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border bg-cream",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-lg px-4 pt-6 pb-4 sm:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wider text-lotus uppercase",
						children: "Sale · Oceanami"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-serif text-title",
						children: "Tìm chỗ trống, gửi khách, theo hoa hồng."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky top-16 z-20 border-t border-border bg-cream/95 backdrop-blur-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto grid max-w-lg grid-cols-3 px-2",
						children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTab(item.id),
							className: `h-12 text-sm font-medium ${tab === item.id ? "border-b-2 border-ink text-ink" : "border-b-2 border-transparent text-muted"}`,
							children: item.label
						}, item.id))
					})
				})]
			}),
			tab === "search" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto max-w-lg px-4 pt-5 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
						className: "rounded-2xl bg-paper p-2 shadow-[var(--shadow-border)]",
						onSubmit: (event) => event.preventDefault(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FieldSplit, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateRangeField, {
							checkIn: search.checkIn,
							checkOut: search.checkOut,
							onChange: (next) => setSaleSearch(next),
							datesLabel: "Ngày",
							calendarTitle: "Ngày đến và ngày đi",
							placeholder: "Chọn ngày",
							formatLabel: viDateRange,
							locale: vi
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuestField, {
							guests: search.guests,
							onChange: (guests) => setSaleSearch({ guests }),
							label: "Số khách",
							heading: "Bao nhiêu khách?",
							peopleLabel: "Khách",
							peopleHint: "Tất cả người ở villa.",
							doneLabel: "Xong",
							valueLabel: (count) => `${count} khách`
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: ready ? `${nights} đêm · ${search.guests} khách · giá công khai, cùng giá khách thấy.` : "Chọn ngày đến và đi."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						title: "Trống",
						count: grouped.open.length,
						empty: "Không có villa trống cho ngày này.",
						children: grouped.open.map((villa) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaleVillaRow, {
							villa,
							open: true,
							nights,
							guests: search.guests,
							ready,
							planLabel: ready ? paymentPlanLabel(villa.nightly * nights, search.checkIn, evaluatedAt) : "",
							copied: copied === `quote-${villa.id}`,
							onQuote: () => void copyQuote(villa),
							onCreate: () => {
								setError(null);
								setGuestName("");
								setCreating(villa);
							}
						}, villa.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, {
						title: "Không trống",
						count: grouped.closed.length,
						empty: "Mọi villa đều trống.",
						children: grouped.closed.map((villa) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaleVillaRow, {
							villa,
							open: false,
							nights,
							guests: search.guests,
							ready,
							planLabel: ready ? paymentPlanLabel(villa.nightly * nights, search.checkIn, evaluatedAt) : "",
							copied: false,
							onQuote: () => void copyQuote(villa),
							onCreate: () => void 0
						}, villa.id))
					})
				]
			}) : null,
			tab === "requests" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6",
				children: myRequests.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Chưa có yêu cầu. Tạo từ tab Tìm villa." }) : myRequests.map((request) => {
					const villa = villas.find((item) => item.id === request.villaId);
					const booking = world.bookings.find((item) => item.requestId === request.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: villa?.name ?? request.villaId
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted",
									children: [
										viDateRange(request.checkIn, request.checkOut),
										" · ",
										request.guests,
										" khách"
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { children: booking ? "Đã xác nhận" : requestStatusVi(request.status) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm",
								children: [request.guestName, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [" · ", formatVnd(request.total)]
								})]
							}),
							request.status === "ACCEPTED" && !booking && request.holdExpiresAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 rounded-xl bg-lotus-soft p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm font-medium text-lotus-deep",
									children: ["Giữ chỗ còn ", holdCountdown(request.holdExpiresAt, clock)]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									className: "mt-3",
									onClick: () => void copyPayment(request.id),
									children: copied === `pay-${request.id}` ? "Đã sao chép" : "Copy link thanh toán"
								})]
							}) : null,
							booking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-sm text-muted",
								children: [
									"Mã đặt",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium text-ink",
										children: booking.reference
									})
								]
							}) : null,
							request.status === "PENDING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: "Đã gửi Host. Sale không xác nhận giúp khách."
							}) : null
						]
					}, request.id);
				})
			}) : null,
			tab === "income" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Hoa hồng dự kiến = 10% tiền phòng. Không gồm payout của Host."
				}), myCommissions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "Chưa có hoa hồng." }) : myCommissions.map((item) => {
					const booking = world.bookings.find((row) => row.id === item.bookingId);
					const villa = villas.find((row) => row.id === booking?.villaId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: villa?.name ?? booking?.villaId
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: booking ? `${viDateRange(booking.checkIn, booking.checkOut)} · ${booking.guestName}` : item.bookingId
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, { children: commissionStatusVi(item.status) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-xs font-semibold tracking-wider text-muted uppercase",
								children: "Hoa hồng dự kiến"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-serif text-2xl tabular-nums",
								children: formatVnd(item.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: "Tạm tính — cơ sở tính hoa hồng chưa chốt"
							})
						]
					}, item.id);
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Root, {
				open: Boolean(creating),
				onOpenChange: (open) => !open && setCreating(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
					className: "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif text-2xl",
							children: "Tạo yêu cầu"
						}),
						creating && ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-ink-soft",
							children: [
								creating.name,
								" · ",
								viDateRange(search.checkIn, search.checkOut),
								" · ",
								search.guests,
								" ",
								"khách · ",
								formatVnd(creating.nightly * nights),
								" · thanh toán",
								" ",
								paymentPlanLabel(creating.nightly * nights, search.checkIn, evaluatedAt)
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-5 block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold tracking-wider text-muted uppercase",
								children: "Tên khách"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: guestName,
								onChange: (event) => setGuestName(event.target.value),
								placeholder: "Nguyễn An",
								className: "mt-2 h-12 w-full rounded-xl bg-cream px-4 text-ink outline-none ring-lotus/40 focus:ring-2"
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-lotus-deep",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								className: "flex-1",
								onClick: () => setCreating(null),
								children: "Huỷ"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "flex-1",
								onClick: submitRequest,
								disabled: !creating || !ready,
								children: "Gửi Host"
							})]
						})
					]
				})] })
			})
		]
	});
}
function Group({ title, count, empty, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8",
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
			children: count === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: empty }) : children
		})]
	});
}
function SaleVillaRow({ villa, open, nights, guests, ready, planLabel, copied, onQuote, onCreate }) {
	const hero = villa.images[0];
	const overCapacity = guests > villa.sleeps;
	const canCreate = open && ready && !overCapacity;
	const total = nights * villa.nightly;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative h-24 w-24 shrink-0 overflow-hidden rounded-xl",
					children: hero ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
						src: hero.src,
						alt: "Ảnh minh hoạ"
					}) : null
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-medium",
								children: villa.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${open ? "bg-lotus-soft text-lotus-deep" : "bg-sand text-muted"}`,
								children: open ? "Trống" : "Không trống"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: ["Ngủ ", villa.sleeps]
						}),
						ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold tabular-nums",
								children: formatVnd(total)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [" · ", planLabel]
							})]
						}) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 px-3 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					className: "h-11",
					disabled: !ready,
					onClick: onQuote,
					children: copied ? "Đã sao chép" : "Gửi cho khách"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					className: "h-11",
					disabled: !canCreate,
					onClick: onCreate,
					children: "Tạo yêu cầu"
				})]
			}),
			open && overCapacity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "px-3 pb-3 text-xs text-muted",
				children: [
					"Ngủ tối đa ",
					villa.sleeps,
					" — không tạo được cho ",
					guests,
					" khách."
				]
			}) : null
		]
	});
}
function StatusPill({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep",
		children
	});
}
function Empty({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]",
		children
	});
}
//#endregion
export { SalePage as component };

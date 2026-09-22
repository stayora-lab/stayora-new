import { o as __toESM } from "../_runtime.mjs";
import { F as addDays, d as format, i as parseISO, t as vi } from "../_libs/date-fns.mjs";
import { B as villasForHost, R as stayGuestLabel, k as paymentPlanLabel, m as commitmentsOnDate, x as hostToday, y as getVilla, z as villas } from "./role-CluaTsFs.mjs";
import { a as formatDueAt, f as requestStatusVi, i as domainMessageVi, l as personaLabel, o as holdCountdown, p as viDateRange, r as commitmentCellLabel, s as hostPaymentStatus, t as balanceLine } from "./copy-mnSy0CY6.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as TriangleAlert } from "../_libs/lucide-react.mjs";
import { o as RoleGate, p as formatVnd, v as useBookingStore, y as Button } from "./router-Dg68rmj1.mjs";
import { t as Drawer } from "../_libs/vaul.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/host-CYhgg0Yt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SOURCES = [
	"Airbnb",
	"Booking.com",
	"Zalo",
	"Khách quen",
	"Khác"
];
function addIso(date, days) {
	return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}
function cellTone(items) {
	if (items.length > 1) return "border-2 border-[#b42318] bg-[#fdecea] text-[#7a1f16]";
	const commitment = items[0];
	if (!commitment) return "bg-cream text-muted";
	if (commitment.kind === "HOLD") return "bg-sand text-ink";
	if (commitment.kind === "AVAILABILITY_BLOCK") return commitment.blockKind === "MAINTENANCE" ? "bg-ink-soft text-cream" : "bg-cream-deep text-ink-soft";
	if (commitment.basis === "EXTERNAL") return "bg-moss/20 text-moss";
	return "bg-lotus-soft text-lotus-deep";
}
function Legend({ swatch, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1.5 text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `inline-block size-3 rounded-sm ${swatch}` }), label]
	});
}
function HostCalendar({ world, villas: villas$1 = villas, onExternal, onBlock, onRelease }) {
	const today = world.now.slice(0, 10);
	const [start, setStart] = (0, import_react.useState)(today);
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const [checkOut, setCheckOut] = (0, import_react.useState)("");
	const [guests, setGuests] = (0, import_react.useState)(2);
	const [source, setSource] = (0, import_react.useState)("Airbnb");
	const [guestName, setGuestName] = (0, import_react.useState)("");
	const [blockKind, setBlockKind] = (0, import_react.useState)("OWNER");
	const [note, setNote] = (0, import_react.useState)("");
	const dates = (0, import_react.useMemo)(() => Array.from({ length: 14 }, (_, index) => addIso(start, index)), [start]);
	function openCell(villaId, date) {
		const commitments = commitmentsOnDate(world, villaId, date);
		setSheet({
			kind: "cell",
			villaId,
			date,
			commitments
		});
		setCheckOut(addIso(date, 2));
		setGuests(2);
		setGuestName("");
		setNote("");
		setSource("Airbnb");
		setBlockKind("OWNER");
	}
	function submitExternal() {
		if (!sheet || sheet.kind !== "external" && sheet.kind !== "cell") return;
		const villaId = sheet.villaId;
		const checkIn = sheet.kind === "external" ? sheet.checkIn : sheet.date;
		onExternal({
			villaId,
			checkIn,
			checkOut: checkOut || addIso(checkIn, 2),
			guests,
			source,
			guestName: guestName.trim() || void 0
		});
		setSheet(null);
	}
	function submitBlock() {
		if (!sheet || sheet.kind !== "block" && sheet.kind !== "cell") return;
		const villaId = sheet.villaId;
		const startDate = sheet.kind === "block" ? sheet.start : sheet.date;
		onBlock({
			villaId,
			start: startDate,
			end: checkOut || addIso(startDate, 1),
			blockKind,
			note: note.trim() || void 0
		});
		setSheet(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2 px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => setStart(addIso(start, -7)),
					children: "Trước"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: viDateRange(dates[0], addIso(dates[13], 1))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => setStart(addIso(start, 7)),
					children: "Sau"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex flex-wrap gap-2 px-4 text-[11px] sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					swatch: "bg-lotus-soft text-lotus-deep",
					label: "Stayora"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					swatch: "bg-moss/20 text-moss",
					label: "Đặt ngoài"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					swatch: "bg-sand text-ink",
					label: "Giữ chỗ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					swatch: "bg-cream-deep text-ink-soft",
					label: "Chặn"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					swatch: "bg-ink-soft text-cream",
					label: "Bảo trì"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					swatch: "border-2 border-[#b42318] bg-[#fdecea] text-[#7a1f16]",
					label: "Xung đột"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "min-w-max border-separate border-spacing-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "sticky left-0 z-10 min-w-28 bg-cream px-3 py-2 text-left text-xs font-semibold tracking-wider text-muted uppercase",
					children: "Villa"
				}), dates.map((date) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
					className: `min-w-20 px-1 py-2 text-center text-xs font-medium ${date === today ? "text-lotus" : "text-muted"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block",
						children: format(parseISO(date), "EEE", { locale: vi })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-ink",
						children: format(parseISO(date), "d/M")
					})]
				}, date))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: villas$1.map((villa) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "sticky left-0 z-10 bg-cream px-3 py-1 text-left text-sm font-medium",
					children: villa.name.replace("Villa ", "")
				}), dates.map((date) => {
					const items = commitmentsOnDate(world, villa.id, date);
					const conflict = items.length > 1;
					const label = conflict ? "Xung đột" : items[0] ? commitmentCellLabel(items[0]) : "Trống";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "p-0.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => openCell(villa.id, date),
							className: `flex h-16 w-20 flex-col justify-center rounded-lg px-1.5 text-left text-[11px] leading-tight ${cellTone(items)}`,
							children: conflict ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mb-0.5 flex items-center gap-0.5 font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3 shrink-0" }), "Xung đột"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "line-clamp-3",
								children: label
							})
						})
					}, date);
				})] }, villa.id)) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Root, {
			open: Boolean(sheet),
			onOpenChange: (open) => !open && setSheet(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
				className: "fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
					sheet?.kind === "cell" ? sheet.commitments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyCell, {
						villaId: sheet.villaId,
						date: sheet.date,
						checkOut,
						setCheckOut,
						guests,
						setGuests,
						source,
						setSource,
						guestName,
						setGuestName,
						blockKind,
						setBlockKind,
						note,
						setNote,
						onExternal: submitExternal,
						onBlock: submitBlock
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OccupiedCell, {
						world,
						date: sheet.date,
						commitments: sheet.commitments,
						onRelease: (id) => {
							onRelease(id);
							setSheet(null);
						},
						onExternal: () => setSheet({
							kind: "external",
							villaId: sheet.villaId,
							checkIn: sheet.date
						})
					}) : null,
					sheet?.kind === "external" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyCell, {
						villaId: sheet.villaId,
						date: sheet.checkIn,
						checkOut,
						setCheckOut,
						guests,
						setGuests,
						source,
						setSource,
						guestName,
						setGuestName,
						blockKind,
						setBlockKind,
						note,
						setNote,
						onExternal: submitExternal,
						only: "external"
					}) : null,
					sheet?.kind === "block" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyCell, {
						villaId: sheet.villaId,
						date: sheet.start,
						checkOut,
						setCheckOut,
						guests,
						setGuests,
						source,
						setSource,
						guestName,
						setGuestName,
						blockKind,
						setBlockKind,
						note,
						setNote,
						onBlock: submitBlock,
						only: "block"
					}) : null
				]
			})] })
		})
	] });
}
function OccupiedCell({ world, date, commitments, onRelease, onExternal }) {
	const conflict = commitments.length > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-semibold tracking-wider text-lotus uppercase",
			children: conflict ? "Xung đột" : "Chi tiết ô"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-1 font-serif text-2xl",
			children: format(parseISO(date), "EEEE d/M", { locale: vi })
		}),
		conflict ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-lotus-deep",
			children: "Hai chỗ cùng lúc. Stayora vận hành sẽ xử lý — không tự chọn bên thắng."
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 space-y-3",
			children: commitments.map((commitment) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommitmentDetail, {
				world,
				commitment,
				onRelease
			}, commitment.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "outline",
			className: "mt-5 w-full",
			onClick: onExternal,
			children: "Ghi đặt ngoài chồng lên"
		})
	] });
}
function CommitmentDetail({ world, commitment, onRelease }) {
	const villa = getVilla(commitment.villaId);
	const booking = commitment.bookingId ? world.bookings.find((item) => item.id === commitment.bookingId) : void 0;
	const stay = commitment.stayId ? world.stays.find((item) => item.id === commitment.stayId) : world.stays.find((item) => item.bookingId === commitment.bookingId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl bg-cream p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: commitmentCellLabel(commitment)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: villa?.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm",
				children: [viDateRange(commitment.start, commitment.end), stay ? ` · ${stay.guestName} · ${stay.guests} khách` : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-3 space-y-1 text-sm text-ink-soft",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Nguồn: ", commitment.source ?? (commitment.basis === "STAYORA_BOOKING" ? "Stayora" : commitment.blockKind ?? "—")] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Mã: ", commitment.reference ?? booking?.reference ?? "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Tạo bởi: ", commitment.createdBy ? personaLabel(commitment.createdBy) : "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Lúc: ", commitment.createdAt ? formatDueAt(commitment.createdAt) : "—"] }),
					commitment.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Ghi chú: ", commitment.note] }) : null
				]
			}),
			commitment.kind === "AVAILABILITY_BLOCK" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				className: "mt-4 w-full",
				onClick: () => onRelease(commitment.id),
				children: "Mở lại lịch"
			}) : null
		]
	});
}
function EmptyCell({ villaId, date, checkOut, setCheckOut, guests, setGuests, source, setSource, guestName, setGuestName, blockKind, setBlockKind, note, setNote, onExternal, onBlock, only }) {
	const villa = getVilla(villaId);
	const [mode, setMode] = (0, import_react.useState)(only ?? "external");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-semibold tracking-wider text-muted uppercase",
			children: "Trống"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-1 font-serif text-2xl",
			children: villa?.name
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-1 text-sm text-muted",
			children: [
				"Từ ",
				format(parseISO(date), "d/M"),
				" · chọn ngày đi"
			]
		}),
		!only ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: mode === "external" ? "primary" : "outline",
				onClick: () => setMode("external"),
				children: "Đặt ngoài"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: mode === "block" ? "primary" : "outline",
				onClick: () => setMode("block"),
				children: "Chặn lịch"
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-4 block text-sm",
			children: ["Ngày đi", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "date",
				value: checkOut,
				onChange: (event) => setCheckOut(event.target.value),
				className: "mt-1 h-12 w-full rounded-xl bg-cream px-4"
			})]
		}),
		mode === "external" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm",
				children: ["Nguồn", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: source,
					onChange: (event) => setSource(event.target.value),
					className: "mt-1 h-12 w-full rounded-xl bg-cream px-4",
					children: SOURCES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: item,
						children: item
					}, item))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm",
				children: ["Tên khách (không bắt buộc)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: guestName,
					onChange: (event) => setGuestName(event.target.value),
					className: "mt-1 h-12 w-full rounded-xl bg-cream px-4"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm",
				children: ["Số khách", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "number",
					min: 1,
					value: guests,
					onChange: (event) => setGuests(Number(event.target.value) || 1),
					className: "mt-1 h-12 w-full rounded-xl bg-cream px-4"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: "Không hỏi giá, doanh thu hay thanh toán."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5 w-full",
				onClick: onExternal,
				children: "Ghi đặt ngoài"
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm",
				children: ["Loại chặn", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: blockKind,
					onChange: (event) => setBlockKind(event.target.value),
					className: "mt-1 h-12 w-full rounded-xl bg-cream px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "OWNER",
						children: "Chủ nhà chặn"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "MAINTENANCE",
						children: "Bảo trì"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm",
				children: ["Ghi chú", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: note,
					onChange: (event) => setNote(event.target.value),
					className: "mt-1 h-12 w-full rounded-xl bg-cream px-4"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5 w-full",
				onClick: onBlock,
				children: "Chặn lịch"
			})
		] })
	] });
}
var TABS = [
	{
		id: "today",
		label: "Hôm nay"
	},
	{
		id: "calendar",
		label: "Lịch"
	},
	{
		id: "requests",
		label: "Yêu cầu"
	},
	{
		id: "stays",
		label: "Đặt chỗ & lưu trú"
	}
];
function HostPage() {
	const hostId = useBookingStore((state) => state.hostId);
	const world = useBookingStore((state) => state.world);
	const hostAccept = useBookingStore((state) => state.hostAccept);
	const hostExternal = useBookingStore((state) => state.hostExternal);
	const hostCreateBlock = useBookingStore((state) => state.hostCreateBlock);
	const hostReleaseBlock = useBookingStore((state) => state.hostReleaseBlock);
	const [tab, setTab] = (0, import_react.useState)("today");
	const [error, setError] = (0, import_react.useState)(null);
	const clock = parseISO(world.now);
	const today = world.now.slice(0, 10);
	const summary = hostToday(world, today);
	const mine = villasForHost(hostId);
	const mineIds = new Set(mine.map((villa) => villa.id));
	const todayPending = summary.pending.filter((item) => mineIds.has(item.villaId));
	const todayArriving = summary.arriving.filter((item) => mineIds.has(item.villaId));
	const todayDeparting = summary.departing.filter((item) => mineIds.has(item.villaId));
	const pending = world.requests.filter((item) => item.status === "PENDING" && mineIds.has(item.villaId));
	const holding = world.requests.filter((item) => item.status === "ACCEPTED" && mineIds.has(item.villaId) && !world.bookings.some((booking) => booking.requestId === item.id && booking.status === "CONFIRMED"));
	const bookedRequests = world.requests.filter((item) => mineIds.has(item.villaId) && world.bookings.some((booking) => booking.requestId === item.id && booking.status === "CONFIRMED"));
	const myStays = world.stays.filter((stay) => mineIds.has(stay.villaId));
	async function run(action) {
		setError(null);
		try {
			await action();
		} catch (err) {
			setError(domainMessageVi(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleGate, {
		allow: ["HOST"],
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			lang: "vi",
			className: "pb-20",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-border bg-cream",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-lg px-4 pt-6 pb-4 sm:px-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold tracking-wider text-lotus uppercase",
								children: "Host · Oceanami"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 font-serif text-title",
								children: "Lịch, yêu cầu, đặt chỗ."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: "Chỉ Host chấp nhận. Thanh toán do Stayora vận hành ghi nhận."
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-lotus-deep",
								children: error
							}) : null
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sticky top-16 z-20 border-t border-border bg-cream/95 backdrop-blur-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto grid max-w-lg grid-cols-4 px-1",
							children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setTab(item.id),
								className: `h-12 px-1 text-xs font-medium sm:text-sm ${tab === item.id ? "border-b-2 border-ink text-ink" : "border-b-2 border-transparent text-muted"}`,
								children: item.label
							}, item.id))
						})
					})]
				}),
				tab === "today" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayCard, {
							title: "Yêu cầu chờ phản hồi",
							count: todayPending.length,
							onClick: () => setTab("requests"),
							children: todayPending.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									getVilla(request.villaId)?.name,
									" · ",
									request.guestName
								]
							}, request.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayCard, {
							title: "Khách đến hôm nay",
							count: todayArriving.length,
							onClick: () => setTab("stays"),
							children: todayArriving.map((stay) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									getVilla(stay.villaId)?.name,
									" · ",
									stay.guestName,
									" · ",
									stay.originLabel
								]
							}, stay.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayCard, {
							title: "Khách đi hôm nay",
							count: todayDeparting.length,
							onClick: () => setTab("stays"),
							children: todayDeparting.map((stay) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									getVilla(stay.villaId)?.name,
									" · ",
									stay.guestName
								]
							}, stay.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayCard, {
							title: "Xung đột lịch đang mở",
							count: summary.openConflicts.length,
							onClick: () => setTab("calendar"),
							children: summary.openConflicts.map((conflict) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [getVilla(conflict.villaId)?.name, " · Stayora vận hành sẽ xử lý"]
							}, conflict.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayCard, {
							title: "Khoản còn lại sắp đến hạn",
							count: summary.balancesDue.length,
							children: summary.balancesDue.map((obligation) => {
								const request = world.requests.find((item) => item.id === obligation.requestId);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm",
									children: [
										request ? getVilla(request.villaId)?.name : obligation.requestId,
										" ·",
										" ",
										balanceLine(obligation, false)
									]
								}, obligation.id);
							})
						})
					]
				}) : null,
				tab === "calendar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "pt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HostCalendar, {
						world,
						villas: mine,
						onExternal: (input) => run(() => hostExternal(input)),
						onBlock: (input) => run(() => hostCreateBlock(input)),
						onRelease: (id) => run(() => hostReleaseBlock(id))
					})
				}) : null,
				tab === "requests" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-lg px-4 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Chờ chấp nhận",
							count: pending.length,
							empty: "Không có yêu cầu mới.",
							children: pending.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
								request,
								clock,
								worldLines: [],
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
							children: holding.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
								request,
								clock,
								worldLines: hostPaymentStatus(world, request.id)
							}, request.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
							title: "Đã xác nhận",
							count: bookedRequests.length,
							empty: "Chưa có booking.",
							children: bookedRequests.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
								request,
								clock,
								booked: true,
								worldLines: [`Mã ${world.bookings.find((item) => item.requestId === request.id)?.reference ?? ""}`, ...hostPaymentStatus(world, request.id)]
							}, request.id))
						})
					]
				}) : null,
				tab === "stays" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6",
					children: myStays.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]",
						children: "Chưa có lưu trú."
					}) : myStays.map((stay) => {
						const booking = world.bookings.find((item) => item.stayId === stay.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: getVilla(stay.villaId)?.name ?? stay.villaId
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-ink-soft",
										children: stay.guestName
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep",
										children: stayGuestLabel(stay.status)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-sm text-muted",
									children: [
										viDateRange(stay.checkIn, stay.checkOut),
										" · ",
										stay.guests,
										" khách"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: stay.originLabel
								}),
								booking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm text-muted",
									children: [
										"Mã ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-ink",
											children: booking.reference
										}),
										booking.status === "CANCELLED" ? " · đã huỷ" : ""
									]
								}) : null
							]
						}, stay.id);
					})
				}) : null
			]
		})
	});
}
function TodayCard({ title, count, children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "block w-full rounded-2xl bg-paper p-4 text-left shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-serif text-2xl tabular-nums",
				children: count
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-1 text-ink-soft",
			children: count === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Không có."
			}) : children
		})]
	});
}
function Section({ title, count, empty, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "pt-6",
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
function RequestCard({ request, clock, action, worldLines, booked }) {
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
			worldLines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-ink-soft",
				children: line
			}, line)),
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: action
			}) : null
		]
	});
}
//#endregion
export { HostPage as component };

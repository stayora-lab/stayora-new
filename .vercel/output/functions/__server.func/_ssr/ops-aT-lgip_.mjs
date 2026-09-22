import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { d as format, i as parseISO, t as vi } from "../_libs/date-fns.mjs";
import { D as stayGuestLabel, O as useBookingStore, g as getVilla, n as BUTLER_LINH, r as Button, w as opsLists } from "./store-Cjzu5u-8.mjs";
import { i as domainMessageVi, p as viDateRange } from "./copy-T4aLQmlW.mjs";
import { t as Drawer } from "../_libs/vaul.mjs";
import { m as ImagePlus, t as X } from "../_libs/lucide-react.mjs";
import { t as DateField } from "./dates-guests-ChdqsI4f.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ops-aT-lgip_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OpsPage() {
	const persona = useBookingStore((state) => state.persona);
	const setPersona = useBookingStore((state) => state.setPersona);
	const world = useBookingStore((state) => state.world);
	const opsDate = useBookingStore((state) => state.opsDate);
	const setOpsDate = useBookingStore((state) => state.setOpsDate);
	const butlerCheckIn = useBookingStore((state) => state.butlerCheckIn);
	const butlerCheckOut = useBookingStore((state) => state.butlerCheckOut);
	const butlerNoShow = useBookingStore((state) => state.butlerNoShow);
	const butlerIncident = useBookingStore((state) => state.butlerIncident);
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const [reason, setReason] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [hasPhoto, setHasPhoto] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (persona !== "BUTLER" && persona !== "BQL") setPersona("BUTLER");
	}, [persona, setPersona]);
	const isBql = persona === "BQL";
	const butler = world.butlers.find((person) => person.id === BUTLER_LINH);
	const lists = opsLists(world, opsDate);
	function assigned(stay) {
		return Boolean(butler?.villaIds?.includes(stay.villaId));
	}
	function run(action) {
		setError(null);
		try {
			action();
		} catch (err) {
			setError(domainMessageVi(err));
		}
	}
	function submitNoShow() {
		if (!sheet || sheet.kind !== "noshow") return;
		if (!reason.trim()) {
			setError("Cần nêu lý do");
			return;
		}
		run(() => butlerNoShow(sheet.stay.id, reason));
		setSheet(null);
		setReason("");
	}
	function submitIncident() {
		if (!sheet || sheet.kind !== "incident") return;
		if (!note.trim()) {
			setError("Cần mô tả sự cố");
			return;
		}
		run(() => butlerIncident(sheet.stay.id, note, hasPhoto));
		setSheet(null);
		setNote("");
		setHasPhoto(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "pb-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-lg px-4 pt-6 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wider text-lotus uppercase",
						children: isBql ? "BQL Oceanami" : "Butler · Linh"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-serif text-title",
						children: "Hôm nay tại Oceanami"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateField, {
							date: opsDate,
							onChange: setOpsDate,
							label: "Ngày",
							calendarTitle: "Chọn ngày",
							locale: vi,
							formatLabel: (value) => format(parseISO(value), "EEEE d/M/yyyy", { locale: vi })
						})
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-lotus-deep",
						children: error
					}) : null,
					isBql ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Chỉ xem. BQL không đổi Stay, Booking, giá hay thanh toán."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Nút thao tác chỉ hiện với villa được giao cho Linh."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayList, {
				title: "Đến hôm nay",
				stays: lists.arriving,
				empty: "Không có khách đến.",
				canAct: !isBql,
				assigned,
				onCheckIn: (stay) => run(() => butlerCheckIn(stay.id)),
				onCheckOut: (stay) => run(() => butlerCheckOut(stay.id)),
				onNoShow: (stay) => {
					setError(null);
					setReason("");
					setSheet({
						kind: "noshow",
						stay
					});
				},
				onIncident: (stay) => {
					setError(null);
					setNote("");
					setHasPhoto(false);
					setSheet({
						kind: "incident",
						stay
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayList, {
				title: "Đang ở",
				stays: lists.inHouse,
				empty: "Không có khách đang ở.",
				canAct: !isBql,
				assigned,
				onCheckIn: (stay) => run(() => butlerCheckIn(stay.id)),
				onCheckOut: (stay) => run(() => butlerCheckOut(stay.id)),
				onNoShow: (stay) => {
					setError(null);
					setReason("");
					setSheet({
						kind: "noshow",
						stay
					});
				},
				onIncident: (stay) => {
					setError(null);
					setNote("");
					setHasPhoto(false);
					setSheet({
						kind: "incident",
						stay
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayList, {
				title: "Đi hôm nay",
				stays: lists.departing,
				empty: "Không có khách trả phòng.",
				canAct: !isBql,
				assigned,
				onCheckIn: (stay) => run(() => butlerCheckIn(stay.id)),
				onCheckOut: (stay) => run(() => butlerCheckOut(stay.id)),
				onNoShow: (stay) => {
					setError(null);
					setReason("");
					setSheet({
						kind: "noshow",
						stay
					});
				},
				onIncident: (stay) => {
					setError(null);
					setNote("");
					setHasPhoto(false);
					setSheet({
						kind: "incident",
						stay
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Root, {
				open: Boolean(sheet),
				onOpenChange: (open) => {
					if (!open) {
						setSheet(null);
						setReason("");
						setNote("");
						setHasPhoto(false);
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
					className: "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
						sheet?.kind === "noshow" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-serif text-2xl",
								children: "Khách không đến"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-sm text-ink-soft",
								children: [
									getVilla(sheet.stay.villaId)?.name,
									" · ",
									sheet.stay.guestName,
									". Không tự đánh dấu khi quá ngày — cần lý do."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: reason,
								onChange: (event) => setReason(event.target.value),
								placeholder: "Lý do",
								rows: 4,
								className: "mt-4 w-full rounded-xl bg-cream p-3 text-ink outline-none ring-lotus/40 focus:ring-2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "flex-1",
									onClick: () => setSheet(null),
									children: "Huỷ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "flex-1",
									onClick: submitNoShow,
									disabled: !reason.trim(),
									children: "Ghi nhận"
								})]
							})
						] }) : null,
						sheet?.kind === "incident" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-serif text-2xl",
								children: "Báo sự cố"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-ink-soft",
								children: "Chỉ tạo hồ sơ sự cố. Không khoá lịch, không đổi Booking."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: note,
								onChange: (event) => setNote(event.target.value),
								placeholder: "Mô tả ngắn",
								rows: 4,
								className: "mt-4 w-full rounded-xl bg-cream p-3 text-ink outline-none ring-lotus/40 focus:ring-2"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setHasPhoto((value) => !value),
								className: "mt-3 flex h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-cream text-sm text-ink-soft",
								children: hasPhoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), " Đã gắn 1 ảnh (placeholder)"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-4" }), " Ảnh — placeholder"] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "flex-1",
									onClick: () => setSheet(null),
									children: "Huỷ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "flex-1",
									onClick: submitIncident,
									disabled: !note.trim(),
									children: "Gửi sự cố"
								})]
							})
						] }) : null
					]
				})] })
			})
		]
	});
}
function StayList({ title, stays, empty, canAct, assigned, onCheckIn, onCheckOut, onNoShow, onIncident }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-lg px-4 pt-8 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-2xl",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: stays.length
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-3",
			children: stays.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]",
				children: empty
			}) : stays.map((stay) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayRow, {
				stay,
				canAct: canAct && assigned(stay),
				onCheckIn: () => onCheckIn(stay),
				onCheckOut: () => onCheckOut(stay),
				onNoShow: () => onNoShow(stay),
				onIncident: () => onIncident(stay)
			}, stay.id))
		})]
	});
}
function StayRow({ stay, canAct, onCheckIn, onCheckOut, onNoShow, onIncident }) {
	const villa = getVilla(stay.villaId);
	const scheduled = stay.status === "SCHEDULED";
	const inHouse = stay.status === "CHECKED_IN";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: villa?.name ?? stay.villaId
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
					stay.guests,
					" khách · ",
					viDateRange(stay.checkIn, stay.checkOut)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs font-medium tracking-wide text-ink-soft uppercase",
				children: stay.originLabel
			}),
			canAct ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-2",
				children: [
					scheduled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-11",
						onClick: onCheckIn,
						children: "Nhận phòng"
					}) : null,
					inHouse ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ink",
						className: "h-11",
						onClick: onCheckOut,
						children: "Trả phòng"
					}) : null,
					scheduled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "h-11",
						onClick: onNoShow,
						children: "Khách không đến"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "h-11",
						onClick: onIncident,
						children: "Báo sự cố"
					})
				]
			}) : null
		]
	});
}
//#endregion
export { OpsPage as component };

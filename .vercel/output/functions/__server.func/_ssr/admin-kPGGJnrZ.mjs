import { i as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { C as obligationSucceeded, O as useBookingStore, g as getVilla, h as formatVnd, r as Button } from "./store-Cjzu5u-8.mjs";
import { a as formatDueAt, d as refundReasonVi, i as domainMessageVi, l as personaLabel, p as viDateRange, r as commitmentCellLabel } from "./copy-T4aLQmlW.mjs";
import { t as Drawer } from "../_libs/vaul.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-kPGGJnrZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		id: "pay",
		label: "Thanh toán"
	},
	{
		id: "unknown",
		label: "Chưa rõ"
	},
	{
		id: "refund",
		label: "Hoàn tiền"
	},
	{
		id: "conflict",
		label: "Xung đột"
	},
	{
		id: "log",
		label: "Nhật ký"
	}
];
function AdminPage() {
	const persona = useBookingStore((state) => state.persona);
	const setPersona = useBookingStore((state) => state.setPersona);
	const world = useBookingStore((state) => state.world);
	const adminRecordPayment = useBookingStore((state) => state.adminRecordPayment);
	const adminResolveUnknown = useBookingStore((state) => state.adminResolveUnknown);
	const adminMarkRefundDone = useBookingStore((state) => state.adminMarkRefundDone);
	const adminResolveConflict = useBookingStore((state) => state.adminResolveConflict);
	const [tab, setTab] = (0, import_react.useState)("pay");
	const [error, setError] = (0, import_react.useState)(null);
	const [refundId, setRefundId] = (0, import_react.useState)(null);
	const [refundNote, setRefundNote] = (0, import_react.useState)("");
	const [conflictId, setConflictId] = (0, import_react.useState)(null);
	const [keepId, setKeepId] = (0, import_react.useState)("");
	const [endId, setEndId] = (0, import_react.useState)("");
	const [conflictReason, setConflictReason] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (persona !== "ADMIN") setPersona("ADMIN");
	}, [persona, setPersona]);
	const unpaidInitial = world.obligations.filter((obligation) => {
		if (obligation.kind !== "INITIAL") return false;
		if (obligationSucceeded(world, obligation.id)) return false;
		if (world.requests.find((item) => item.id === obligation.requestId)?.status !== "ACCEPTED") return false;
		if (world.bookings.some((booking) => booking.requestId === obligation.requestId && booking.status === "CONFIRMED")) return false;
		return !world.attempts.some((attempt) => attempt.obligationId === obligation.id && attempt.status === "UNKNOWN");
	});
	const unpaidBalance = world.obligations.filter((obligation) => {
		if (obligation.kind !== "BALANCE") return false;
		if (obligationSucceeded(world, obligation.id)) return false;
		if (!world.bookings.some((booking) => booking.requestId === obligation.requestId && booking.status === "CONFIRMED")) return false;
		return !world.attempts.some((attempt) => attempt.obligationId === obligation.id && attempt.status === "UNKNOWN");
	});
	const unknowns = world.attempts.filter((item) => item.status === "UNKNOWN");
	const openRefunds = (world.refundCases ?? []).filter((item) => item.status === "OPEN");
	const openConflicts = (world.conflicts ?? []).filter((item) => item.status === "OPEN");
	const log = [...world.auditLog ?? []];
	function run(action) {
		setError(null);
		try {
			action();
		} catch (err) {
			setError(domainMessageVi(err));
		}
	}
	const conflict = openConflicts.find((item) => item.id === conflictId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
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
							children: "Stayora vận hành"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 font-serif text-title",
							children: "Thanh toán, hoàn tiền, xung đột."
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-lotus-deep",
							children: error
						}) : null
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky top-16 z-20 border-t border-border bg-cream/95 backdrop-blur-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto grid max-w-lg grid-cols-5 px-1",
						children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setTab(item.id),
							className: `h-12 px-1 text-[11px] font-medium sm:text-sm ${tab === item.id ? "border-b-2 border-ink text-ink" : "border-b-2 border-transparent text-muted"}`,
							children: item.label
						}, item.id))
					})
				})]
			}),
			tab === "pay" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-lg px-4 pt-5 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Queue, {
					title: "Ghi nhận thanh toán",
					empty: "Không có khoản cần ghi.",
					children: [...unpaidInitial, ...unpaidBalance].map((obligation) => {
						const request = world.requests.find((item) => item.id === obligation.requestId);
						const villa = request ? getVilla(request.villaId) : void 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: villa?.name ?? obligation.requestId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-ink-soft",
									children: request?.guestName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm",
									children: [
										obligation.kind === "INITIAL" ? "Đợt đầu" : "Phần còn lại",
										" ·",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold tabular-nums",
											children: formatVnd(obligation.amount)
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted",
									children: ["Hạn ", formatDueAt(obligation.dueAt)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentButtons, { onRecord: (outcome) => run(() => adminRecordPayment(obligation.id, outcome)) })
							]
						}, obligation.id);
					})
				})
			}) : null,
			tab === "unknown" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-lg px-4 pt-5 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Queue, {
					title: "Thanh toán chưa xác định",
					empty: "Không có khoản chưa rõ.",
					children: unknowns.map((attempt) => {
						const obligation = world.obligations.find((item) => item.id === attempt.obligationId);
						const request = world.requests.find((item) => item.id === obligation?.requestId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: request ? getVilla(request.villaId)?.name : attempt.obligationId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-lotus-deep",
									children: "Chưa xác định được kết quả thanh toán. Đừng thanh toán lại."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: () => run(() => adminResolveUnknown(attempt.id, "SUCCEEDED")),
										children: "Xác nhận đã nhận"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										onClick: () => run(() => adminResolveUnknown(attempt.id, "FAILED")),
										children: "Xác nhận thất bại"
									})]
								})
							]
						}, attempt.id);
					})
				})
			}) : null,
			tab === "refund" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-lg px-4 pt-5 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Queue, {
					title: "Cần hoàn tiền",
					empty: "Không có khoản cần hoàn.",
					children: openRefunds.map((refund) => {
						const request = world.requests.find((item) => item.id === refund.requestId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: request ? getVilla(request.villaId)?.name : refund.requestId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-ink-soft",
									children: request?.guestName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 font-semibold tabular-nums",
									children: formatVnd(refund.amount)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: refundReasonVi(refund.reason)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "mt-4 w-full",
									onClick: () => {
										setRefundId(refund.id);
										setRefundNote("");
									},
									children: "Đánh dấu đã hoàn"
								})
							]
						}, refund.id);
					})
				})
			}) : null,
			tab === "conflict" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-lg px-4 pt-5 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Queue, {
					title: "Xung đột lịch",
					empty: "Không có xung đột mở.",
					children: openConflicts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: getVilla(item.villaId)?.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-lotus-deep",
								children: "Hai chỗ cùng lúc — không tự chọn bên thắng."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 grid gap-2 sm:grid-cols-2",
								children: item.commitmentIds.map((id) => {
									const commitment = world.commitments.find((row) => row.id === id);
									if (!commitment) return null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl bg-cream p-3 text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium",
												children: commitmentCellLabel(commitment)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-muted",
												children: viDateRange(commitment.start, commitment.end)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-muted",
												children: commitment.reference ?? commitment.id
											})
										]
									}, id);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "mt-4 w-full",
								onClick: () => {
									setConflictId(item.id);
									setKeepId(item.commitmentIds[0] ?? "");
									setEndId(item.commitmentIds[1] ?? "");
									setConflictReason("");
								},
								children: "Giải quyết"
							})
						]
					}, item.id))
				})
			}) : null,
			tab === "log" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto max-w-lg px-4 pt-5 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Queue, {
					title: "Nhật ký",
					empty: "Chưa có nhật ký.",
					children: log.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: formatDueAt(entry.at)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-medium",
								children: entry.action
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-ink-soft",
								children: [
									personaLabel(entry.persona),
									" · ",
									entry.objectId
								]
							}),
							entry.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: entry.reason
							}) : null
						]
					}, entry.id))
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Root, {
				open: Boolean(refundId),
				onOpenChange: (open) => !open && setRefundId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
					className: "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif text-2xl",
							children: "Đánh dấu đã hoàn"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 block text-sm",
							children: ["Ghi chú", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: refundNote,
								onChange: (event) => setRefundNote(event.target.value),
								className: "mt-1 h-12 w-full rounded-xl bg-cream px-4"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full",
							disabled: !refundNote.trim(),
							onClick: () => {
								if (!refundId || !refundNote.trim()) return;
								run(() => adminMarkRefundDone(refundId, refundNote));
								setRefundId(null);
							},
							children: "Đánh dấu đã hoàn"
						})
					]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Root, {
				open: Boolean(conflict),
				onOpenChange: (open) => !open && setConflictId(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
					className: "fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif text-2xl",
							children: "Giải quyết xung đột"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Chỉ kết thúc một commitment. Cần lý do."
						}),
						conflict ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-4 block text-sm",
								children: ["Giữ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: keepId,
									onChange: (event) => setKeepId(event.target.value),
									className: "mt-1 h-12 w-full rounded-xl bg-cream px-4",
									children: conflict.commitmentIds.map((id) => {
										const commitment = world.commitments.find((item) => item.id === id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: id,
											children: commitment ? commitmentCellLabel(commitment) : id
										}, id);
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 block text-sm",
								children: ["Kết thúc", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: endId,
									onChange: (event) => setEndId(event.target.value),
									className: "mt-1 h-12 w-full rounded-xl bg-cream px-4",
									children: conflict.commitmentIds.map((id) => {
										const commitment = world.commitments.find((item) => item.id === id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: id,
											children: commitment ? commitmentCellLabel(commitment) : id
										}, id);
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 block text-sm",
								children: ["Lý do", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: conflictReason,
									onChange: (event) => setConflictReason(event.target.value),
									className: "mt-1 h-12 w-full rounded-xl bg-cream px-4"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "mt-5 w-full",
								disabled: !conflictReason.trim() || keepId === endId,
								onClick: () => {
									run(() => adminResolveConflict({
										conflictId: conflict.id,
										keepCommitmentId: keepId,
										endCommitmentId: endId,
										reason: conflictReason
									}));
									setConflictId(null);
								},
								children: "Kết thúc commitment đã chọn"
							})
						] }) : null
					]
				})] })
			})
		]
	});
}
function PaymentButtons({ onRecord }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 grid grid-cols-3 gap-2",
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
	});
}
function Queue({ title, empty, children }) {
	const count = (Array.isArray(children) ? children.filter(Boolean) : [children]).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
	})] });
}
//#endregion
export { AdminPage as component };

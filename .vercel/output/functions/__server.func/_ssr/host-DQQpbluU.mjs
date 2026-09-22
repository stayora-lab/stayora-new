import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as paymentRuleLabel, T as useBookingStore, m as getVilla, p as formatVnd } from "./store-DTEBiuLL.mjs";
import { n as domainMessageVi, o as requestStatusVi, r as holdCountdown, s as viDateRange } from "./copy-CmdC2Qzr.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-Cj0Y92zJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/host-DQQpbluU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HostPage() {
	const persona = useBookingStore((state) => state.persona);
	const setPersona = useBookingStore((state) => state.setPersona);
	const world = useBookingStore((state) => state.world);
	const hostAccept = useBookingStore((state) => state.hostAccept);
	const hostConfirm = useBookingStore((state) => state.hostConfirm);
	const [error, setError] = (0, import_react.useState)(null);
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		if (persona !== "HOST") setPersona("HOST");
	}, [persona, setPersona]);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => window.clearInterval(id);
	}, []);
	const pending = world.requests.filter((item) => item.status === "PENDING");
	const accepted = world.requests.filter((item) => item.status === "ACCEPTED");
	const confirmed = world.requests.filter((item) => item.status === "CONFIRMED");
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
				children: "Chỉ Host chấp nhận và xác nhận. Sale không giữ chỗ giúp khách."
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
					now,
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: () => run(() => hostAccept(request.id)),
						children: "Chấp nhận · giữ 24 giờ"
					})
				}, request.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Đang giữ chỗ",
				count: accepted.length,
				empty: "Không có chỗ đang giữ.",
				children: accepted.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
					request,
					now,
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: () => run(() => hostConfirm(request.id)),
						children: "Xác nhận đặt"
					})
				}, request.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Đã xác nhận",
				count: confirmed.length,
				empty: "Chưa có booking.",
				children: confirmed.map((request) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequestCard, {
					request,
					now
				}, request.id))
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
function RequestCard({ request, now, action }) {
	const villa = getVilla(request.villaId);
	const source = request.source === "SALE" ? "Sale · Mai" : "Khách trực tiếp";
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
					children: requestStatusVi(request.status)
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
					children: [" · ", paymentRuleLabel(request.paymentRule)]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs font-medium tracking-wide text-ink-soft uppercase",
				children: source
			}),
			request.status === "ACCEPTED" && request.holdExpiresAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-lotus-deep",
				children: ["Giữ còn ", holdCountdown(request.holdExpiresAt, now)]
			}) : null,
			request.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-sm text-muted",
				children: ["Mã ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-ink",
					children: request.reference
				})]
			}) : null,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: action
			}) : null
		]
	});
}
//#endregion
export { HostPage as component };

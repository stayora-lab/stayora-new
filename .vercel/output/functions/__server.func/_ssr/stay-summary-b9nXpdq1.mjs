import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { _ as guestLabel, h as formatVnd, m as formatDateRange, x as nightLabel } from "./store-Cjzu5u-8.mjs";
import { t as Photo } from "./photo-CJc6ew_l.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stay-summary-b9nXpdq1.js
var import_jsx_runtime = require_jsx_runtime();
function StaySummary({ villa, request, totalLabel = "Stay total" }) {
	const hero = villa.images[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: "overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid sm:grid-cols-[11rem_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-40 sm:h-full",
				children: [hero ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
					src: hero.src,
					alt: "Ảnh minh hoạ"
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute bottom-2 left-2 rounded-full bg-paper/92 px-2 py-0.5 text-[11px] text-muted",
					children: "Ảnh minh hoạ"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold tracking-wider text-lotus uppercase",
						children: ["Oceanami · ", villa.settingLabel]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-medium",
						children: villa.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-ink-soft",
						children: formatDateRange(request.checkIn, request.checkOut)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							nightLabel(request.nights),
							" · ",
							guestLabel(request.guests)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							totalLabel,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium tabular-nums",
								children: formatVnd(request.total)
							})
						]
					})
				]
			})]
		})
	});
}
//#endregion
export { StaySummary as t };

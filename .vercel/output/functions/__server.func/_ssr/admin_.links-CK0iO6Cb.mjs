import { o as __toESM } from "../_runtime.mjs";
import { L as roleLinks } from "./role-CluaTsFs.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as Button } from "./router-Dg68rmj1.mjs";
import { t as copyText } from "./clipboard-Cgk-ttDo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin_.links-CK0iO6Cb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RoleLinksPage() {
	const [copied, setCopied] = (0, import_react.useState)(null);
	const origin = typeof window === "undefined" ? "" : window.location.origin;
	const links = (0, import_react.useMemo)(() => roleLinks(), []);
	async function copy(vai) {
		const url = `${origin}/?vai=${encodeURIComponent(vai)}`;
		const ok = await copyText(url);
		setCopied(ok ? vai : null);
		window.setTimeout(() => setCopied(null), 2e3);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 py-8 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wider text-lotus uppercase",
				children: "Field test"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-serif text-title",
				children: "Link vai trò"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-ink-soft",
				children: "Mỗi người mở link của mình trên điện thoại. Vai trò được nhớ trên thiết bị đó. Không cần đăng nhập. Không có giao dịch thật."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 space-y-3",
				children: links.map((item) => {
					const href = `/?vai=${encodeURIComponent(item.vai)}`;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: item.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 break-all text-sm text-muted",
								children: [origin, href]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									asChild: true,
									variant: "outline",
									size: "sm",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href,
										children: "Mở"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => void copy(item.vai),
									children: copied === item.vai ? "Đã chép" : "Chép link"
								})]
							})
						]
					}, item.vai);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-8 text-xs text-muted",
				children: [
					"Thêm ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "?demo=1" }),
					" để hiện bộ chọn vai (chỉ dùng khi thử)."
				]
			})
		]
	});
}
//#endregion
export { RoleLinksPage as component };

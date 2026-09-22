import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { b as cn } from "./router-Dg68rmj1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/photo-BYGbni-T.js
var import_jsx_runtime = require_jsx_runtime();
function Photo({ src, alt, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt,
		className: cn("size-full object-cover photo-frame", className)
	});
}
function VillaPlaceholder({ name, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex size-full items-center justify-center bg-cream-deep text-center", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-4 font-serif text-xl text-ink-soft sm:text-2xl",
			children: name
		})
	});
}
//#endregion
export { VillaPlaceholder as n, Photo as t };

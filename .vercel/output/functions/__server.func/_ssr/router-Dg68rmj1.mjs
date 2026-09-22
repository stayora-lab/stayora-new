import { o as __toESM } from "../_runtime.mjs";
import { A as differenceInCalendarDays, F as addDays, c as isAfter, d as format, i as parseISO, j as startOfDay } from "../_libs/date-fns.mjs";
import { E as occupiedRanges, O as parseVai, S as isAvailable, V as workspaceFor, a as PILOT_NOW, g as createEmptyWorld, o as PILOT_SEED, r as DomainError, s as ROLE_STORAGE_KEY } from "./role-CluaTsFs.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Slot } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { _ as createRootRoute, b as useNavigate, d as useRouterState, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { o as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-CStt4xXU.js
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[transform,background-color,box-shadow,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			primary: "bg-lotus text-cream hover:bg-lotus-deep",
			ink: "bg-ink text-cream hover:bg-ink-soft",
			outline: "bg-paper text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "bg-transparent text-ink hover:bg-cream-deep",
			soft: "bg-lotus-soft text-lotus-deep hover:bg-sand"
		},
		size: {
			sm: "h-9 px-3.5 text-sm",
			md: "h-11 px-5 text-sm",
			lg: "h-12 px-6 text-[0.95rem]",
			xl: "h-14 px-7 text-base"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/store-DIckq30L.js
var DEFAULT_CHECK_IN = "2026-10-16";
var DEFAULT_CHECK_OUT = "2026-10-19";
function parseStaySearch(search) {
	const checkIn = typeof search.checkIn === "string" ? search.checkIn : void 0;
	const checkOut = typeof search.checkOut === "string" ? search.checkOut : void 0;
	const rawGuests = Number(search.guests);
	return {
		checkIn,
		checkOut,
		guests: Number.isInteger(rawGuests) && rawGuests >= 1 && rawGuests <= 16 ? rawGuests : void 0
	};
}
function isIsoDate(value) {
	if (!value) return false;
	const date = parseISO(value);
	return !Number.isNaN(date.getTime()) && value.length >= 10;
}
function nightsBetween(checkIn, checkOut) {
	return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}
function formatVnd(amount) {
	return `₫${amount.toLocaleString("en-US")}`;
}
function formatDateRange(checkIn, checkOut) {
	const start = parseISO(checkIn);
	const end = parseISO(checkOut);
	if (start.getFullYear() !== end.getFullYear()) return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
	if (start.getMonth() !== end.getMonth()) return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
	return `${format(start, "d")}–${format(end, "d MMM yyyy")}`;
}
function guestLabel(count) {
	return count === 1 ? "1 guest" : `${count} guests`;
}
function nightLabel(count) {
	return count === 1 ? "1 night" : `${count} nights`;
}
function bedroomLabel(count) {
	return count === 1 ? "1 bedroom" : `${count} bedrooms`;
}
function isRangeAvailable(villa, checkIn, checkOut, world) {
	if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return false;
	if (nightsBetween(checkIn, checkOut) < 1) return false;
	if (!world) return true;
	return isAvailable(world, villa.id, checkIn, checkOut);
}
function bookability(villa, checkIn, checkOut, guests, world) {
	if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || nightsBetween(checkIn, checkOut) < 1) return { state: "missing-dates" };
	if (guests > villa.sleeps) return {
		state: "too-many-guests",
		sleeps: villa.sleeps
	};
	if (!isRangeAvailable(villa, checkIn, checkOut, world)) return { state: "unavailable" };
	return { state: "ready" };
}
function bookabilityCopy(result) {
	switch (result.state) {
		case "ready": return "Available to request";
		case "missing-dates": return "Check dates";
		case "unavailable": return "Not available for these dates";
		case "too-many-guests": return `Sleeps up to ${result.sleeps}`;
	}
}
function disabledMatchers(villa, world) {
	const matchers = [{ before: startOfDay(/* @__PURE__ */ new Date()) }];
	if (!villa || !world) return matchers;
	for (const block of occupiedRanges(world, villa.id)) {
		const from = parseISO(block.start);
		const to = addDays(parseISO(block.end), -1);
		if (isAfter(to, addDays(from, -1))) matchers.push({
			from,
			to
		});
	}
	return matchers;
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchWorld = createServerFn({ method: "GET" }).handler(createSsrRpc("fe933c2de899b2acd5d0d9b63e3f1e4227b462c5a90673b2ad48ed7c428e725f"));
var submitWorldAction = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("90c6ac975556e0e5ae78c7c7aa8ac1e6898cc50f1cbdf8918c8be8ede3fb49ad"));
function roleOf(state) {
	return {
		persona: state.persona,
		saleId: state.saleId,
		hostId: state.hostId,
		butlerId: state.butlerId
	};
}
var useBookingStore = create()(persist((set, get) => ({
	hydrated: false,
	persona: "GUEST",
	demoMode: false,
	world: createEmptyWorld(PILOT_NOW),
	version: 0,
	updatedAt: null,
	fetchedAt: null,
	search: {
		checkIn: DEFAULT_CHECK_IN,
		checkOut: DEFAULT_CHECK_OUT,
		guests: 4
	},
	saleSearch: {
		checkIn: "2026-09-25",
		checkOut: "2026-09-28",
		guests: 8
	},
	opsDate: "2026-09-22",
	setHydrated: (value) => set({ hydrated: value }),
	setPersona: (persona) => set({ persona }),
	setRole: (role) => set({
		persona: role.persona,
		saleId: role.saleId,
		hostId: role.hostId,
		butlerId: role.butlerId
	}),
	setDemoMode: (demoMode) => set({ demoMode }),
	setSearch: (search) => set((state) => ({ search: {
		...state.search,
		...search
	} })),
	setSaleSearch: (search) => set((state) => ({ saleSearch: {
		...state.saleSearch,
		...search
	} })),
	setOpsDate: (opsDate) => set({ opsDate }),
	refreshWorld: async () => {
		try {
			const payload = await fetchWorld();
			set({
				world: payload.world,
				version: payload.version,
				updatedAt: payload.updatedAt,
				fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
				hydrated: true
			});
		} catch {
			set({ hydrated: true });
		}
	},
	applyVaiFromUrl: () => {
		if (typeof window === "undefined") return null;
		const params = new URLSearchParams(window.location.search);
		if (params.get("demo") === "1") set({ demoMode: true });
		const role = parseVai(params.get("vai"));
		if (role) get().setRole(role);
		return role;
	},
	runAction: async (action) => {
		const result = await submitWorldAction({ data: {
			action,
			role: roleOf(get())
		} });
		if (!result.ok) throw new DomainError(result.code, result.message);
		set({
			world: result.world,
			version: result.version,
			updatedAt: result.updatedAt,
			fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
		});
		return { requestId: result.requestId };
	},
	advanceDemo: async () => {
		await get().runAction({ type: "ADVANCE_TIME" });
	},
	resetWorld: async () => {
		await get().runAction({ type: "RESET" });
	},
	guestCreateRequest: async (input) => {
		const result = await get().runAction({
			type: "CREATE_REQUEST",
			...input,
			guestName: "Khách"
		});
		if (!result.requestId) throw new DomainError("INVALID", "Không tạo được yêu cầu");
		return { requestId: result.requestId };
	},
	saleCreateRequest: async (input) => {
		const result = await get().runAction({
			type: "CREATE_REQUEST",
			...input
		});
		if (!result.requestId) throw new DomainError("INVALID", "Không tạo được yêu cầu");
		return { requestId: result.requestId };
	},
	hostAccept: async (requestId) => {
		await get().runAction({
			type: "ACCEPT_REQUEST",
			requestId
		});
	},
	hostExternal: async (input) => {
		await get().runAction({
			type: "RECORD_EXTERNAL",
			...input
		});
	},
	hostCreateBlock: async (input) => {
		await get().runAction({
			type: "CREATE_BLOCK",
			...input
		});
	},
	hostReleaseBlock: async (commitmentId) => {
		await get().runAction({
			type: "RELEASE_BLOCK",
			commitmentId
		});
	},
	adminRecordPayment: async (obligationId, outcome) => {
		await get().runAction({
			type: "RECORD_PAYMENT",
			obligationId,
			outcome
		});
	},
	adminResolveUnknown: async (attemptId, outcome) => {
		await get().runAction({
			type: "RESOLVE_UNKNOWN",
			attemptId,
			outcome
		});
	},
	adminMarkRefundDone: async (refundId, note) => {
		await get().runAction({
			type: "MARK_REFUND",
			refundId,
			note
		});
	},
	adminResolveConflict: async (input) => {
		await get().runAction({
			type: "RESOLVE_CONFLICT",
			...input
		});
	},
	butlerCheckIn: async (stayId) => {
		await get().runAction({
			type: "CHECK_IN",
			stayId
		});
	},
	butlerCheckOut: async (stayId) => {
		await get().runAction({
			type: "CHECK_OUT",
			stayId
		});
	},
	butlerNoShow: async (stayId, reason) => {
		await get().runAction({
			type: "DID_NOT_OCCUR",
			stayId,
			reason
		});
	},
	butlerIncident: async (stayId, note, hasPhoto) => {
		await get().runAction({
			type: "REPORT_INCIDENT",
			stayId,
			note,
			hasPhoto
		});
	}
}), {
	name: ROLE_STORAGE_KEY,
	storage: createJSONStorage(() => localStorage),
	skipHydration: true,
	partialize: (state) => ({
		persona: state.persona,
		saleId: state.saleId,
		hostId: state.hostId,
		butlerId: state.butlerId,
		demoMode: state.demoMode,
		search: state.search,
		saleSearch: state.saleSearch,
		opsDate: state.opsDate
	}),
	onRehydrateStorage: () => (state) => {
		state?.setHydrated(true);
	}
}));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/mark-BGXJcWGF.js
var LOTUS_D = "M 754.511 1085.98 C 729.96 1112.85 706.925 1140.14 681.56 1165.08 C 652.487 1193.62 624.937 1224.11 591.021 1247.3 C 581.017 1254.15 570.273 1260.6 558.949 1264.65 C 540.153 1271.38 521.175 1268.33 504.527 1257.76 C 487.73 1247.08 471.31 1235.49 456.156 1222.62 C 435.263 1204.87 415.371 1185.88 395.66 1166.78 C 359.126 1131.41 324.502 1094.2 292.771 1054.39 C 263.611 1017.81 234.893 980.844 210.299 940.969 C 192.976 912.884 176.09 884.468 160.397 855.446 C 139.212 816.266 120.508 775.883 104.83 734.069 C 89.134 692.208 78.101 649.163 69.228 605.466 C 56.624 543.396 58.707 481.31 70.36 419.474 C 81.265 361.608 103.078 307.905 134.352 257.984 C 160.97 215.492 193.333 178.075 231.426 145.619 C 255.5 125.108 282.12 108.294 309.255 92.183 C 353.88 65.689 402.687 50.417 452.882 39.952 C 510.427 27.952 568.397 27.854 626.302 39.416 C 676.874 49.514 724.919 66.531 770.209 91.089 C 796.619 105.409 820.954 122.918 844.024 142.227 C 872.034 165.672 897.374 191.799 919.336 220.856 C 933.6 239.73 946.069 260.099 957.998 280.583 C 986.192 328.996 1002.5 381.834 1011.64 436.768 C 1019.35 483.166 1020.87 530.003 1012.92 576.606 C 1007.17 610.278 999.599 643.578 989.752 676.368 C 971.968 735.582 947.776 792.059 918.36 846.302 C 903.517 873.673 888.353 900.919 872.068 927.441 C 859.48 947.943 845.294 967.501 831.146 986.989 C 813.97 1010.65 796.227 1033.91 778.442 1057.12 C 771.008 1066.82 762.834 1075.96 754.511 1085.98 Z  M576.679932,667.637817 C571.060730,667.959167 567.981628,666.468323 568.026367,661.092224 C568.092834,653.112061 568.085449,645.130493 568.017517,637.150330 C567.975037,632.157288 570.348999,629.854553 575.317993,629.907410 C582.300415,629.981750 589.284912,629.977112 596.267273,629.898499 C601.053589,629.844666 603.996460,631.866272 604.043213,636.838867 C604.118286,644.814758 604.257812,652.810242 603.797852,660.764404 C603.435547,667.029419 602.297058,667.835205 595.547546,667.966431 C589.570496,668.082642 583.585022,667.765930 576.679932,667.637817 z  M630.057007,676.227478 C648.670288,676.142212 648.766174,674.769836 648.537903,693.380249 C648.476807,698.360413 648.436035,703.343750 648.539917,708.322388 C648.642151,713.228516 646.358459,715.901672 641.475769,715.906433 C634.175171,715.913635 626.874084,715.687683 619.573669,715.537231 C615.448120,715.452271 613.648560,713.181091 613.654236,709.191772 C613.665466,701.222473 613.501526,693.250061 613.673401,685.284668 C613.847717,677.211365 614.725891,676.498108 623.141846,676.238464 C625.132324,676.177002 627.126221,676.228027 630.057007,676.227478 z  M614.513855,664.759766 C614.089172,653.135498 614.089172,642.323425 614.089172,630.719299 C625.353455,630.719299 635.724182,630.719299 647.344666,630.719299 C647.614136,635.717102 648.149780,640.540710 648.087769,645.356689 C647.758301,670.924377 652.091309,667.399048 625.251587,667.542908 C621.817566,667.561340 618.376404,666.261230 614.513855,664.759766 z  M569.317261,692.167603 C569.315979,676.680542 567.600403,675.996704 584.716064,676.251770 C589.024597,676.315979 593.334778,676.262329 597.643860,676.302551 C601.647522,676.339905 603.913269,678.450623 603.969543,682.392151 C604.097351,691.339539 604.062622,700.290466 603.981628,709.238953 C603.947754,712.981995 601.501465,714.497009 598.110962,714.532654 C590.488281,714.612854 582.863525,714.602295 575.240784,714.519165 C571.077454,714.473755 569.435486,711.881042 569.382446,708.051819 C569.313538,703.080322 569.334961,698.107605 569.317261,692.167603 z";
function StayoraIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "40 10 996 1276",
		className: cn("h-8 w-auto shrink-0", className),
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			fillRule: "evenodd",
			d: LOTUS_D
		})
	});
}
function StayoraMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("inline-flex items-center gap-2.5 text-ink", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayoraIcon, { className: "h-8 text-lotus" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-sans text-lg font-semibold tracking-tight",
			children: "Stayora"
		})]
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Dg68rmj1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var PERSONAS = [
	{
		id: "GUEST",
		label: "Khách",
		to: "/"
	},
	{
		id: "SALE",
		label: "Sale",
		to: "/sale"
	},
	{
		id: "HOST",
		label: "Host",
		to: "/host"
	},
	{
		id: "BUTLER",
		label: "Butler",
		to: "/ops"
	},
	{
		id: "BQL",
		label: "BQL",
		to: "/ops"
	},
	{
		id: "ADMIN",
		label: "Stayora vận hành",
		to: "/admin"
	}
];
function TrialBanner() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "bg-ink px-3 py-2 text-center text-xs font-medium tracking-wide text-cream",
		children: "Bản thử nghiệm — không có giao dịch thật."
	});
}
function PersonaSwitch() {
	const persona = useBookingStore((state) => state.persona);
	const demoMode = useBookingStore((state) => state.demoMode);
	const setRole = useBookingStore((state) => state.setRole);
	const navigate = useNavigate();
	if (!demoMode) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex items-center gap-2 text-xs text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: "Vai"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
			value: persona,
			onChange: (event) => {
				const next = event.target.value;
				if (next === "SALE") setRole({
					persona: "SALE",
					saleId: PILOT_SEED.sales[0]?.id
				});
				else if (next === "HOST") setRole({
					persona: "HOST",
					hostId: PILOT_SEED.hosts[0]?.id
				});
				else if (next === "BUTLER") setRole({
					persona: "BUTLER",
					butlerId: PILOT_SEED.butlers[0]?.id
				});
				else setRole({ persona: next });
				const target = PERSONAS.find((item) => item.id === next);
				if (target) navigate({ to: target.to });
			},
			className: "h-9 max-w-44 rounded-full bg-paper px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]",
			children: PERSONAS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: item.id,
				children: item.label
			}, item.id))
		})]
	});
}
function SiteHeader() {
	const hydrated = useBookingStore((state) => state.hydrated);
	const persona = useBookingStore((state) => state.persona);
	const world = useBookingStore((state) => state.world);
	const fetchedAt = useBookingStore((state) => state.fetchedAt);
	const latest = world.requests.find((item) => item.source === "GUEST");
	const latestBooking = latest ? world.bookings.find((item) => item.requestId === latest.id) : void 0;
	const path = useRouterState({ select: (state) => state.location.pathname });
	const workspace = path.startsWith("/sale") || path.startsWith("/ops") || path.startsWith("/host") || path.startsWith("/admin");
	const stamp = fetchedAt ? format(parseISO(fetchedAt), "HH:mm:ss") : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-30 border-b border-border bg-cream/90 backdrop-blur-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrialBanner, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "shrink-0",
					"aria-label": "Stayora home",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayoraMark, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden min-w-0 md:block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm text-ink-soft",
						children: workspace ? workspaceTitle(path, persona) : "Oceanami · Phước Hải"
					}), stamp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] text-muted",
						children: ["Cập nhật lúc ", stamp]
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						hydrated && persona === "GUEST" && latest ? latestBooking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/your-stay/$stayId",
							params: { stayId: latestBooking.stayId },
							className: "rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep",
							children: "Your stay"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/requests/$requestId",
							params: { requestId: latest.id },
							className: "rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep",
							children: "Your request"
						}) : null,
						stamp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted md:hidden",
							children: ["Cập nhật lúc ", stamp]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PersonaSwitch, {})
					]
				})
			]
		})]
	});
}
function workspaceTitle(path, persona) {
	if (path.startsWith("/sale")) return "Sale · Oceanami";
	if (path.startsWith("/host")) return "Host · Oceanami";
	if (path.startsWith("/admin")) return "Stayora vận hành";
	if (persona === "BQL") return "BQL Oceanami · Hôm nay";
	if (path.startsWith("/ops")) return "Butler · Hôm nay";
	return "Oceanami · Phước Hải";
}
function SiteFooter() {
	if (useBookingStore((state) => state.persona) !== "GUEST") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "border-t border-border bg-cream-deep/60",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StayoraMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-sm text-sm text-muted",
				children: "Private villas in Vietnam. This first destination is Oceanami, on Phước Hải beach."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Oceanami · Phước Hải · Bà Rịa–Vũng Tàu"
			})]
		})
	});
}
function DemoPanel() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const persona = useBookingStore((state) => state.persona);
	const advanceDemo = useBookingStore((state) => state.advanceDemo);
	const resetWorld = useBookingStore((state) => state.resetWorld);
	if (!open) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => setOpen(true),
		className: "fixed right-3 bottom-3 z-40 rounded-full bg-paper px-3 py-2 text-xs font-medium text-muted shadow-[var(--shadow-border)]",
		children: "Demo"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed right-3 bottom-3 z-40 w-56 rounded-2xl bg-paper p-3 shadow-[var(--shadow-lift)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold tracking-wider text-muted uppercase",
					children: "Bảng điều khiển demo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-xs text-muted",
					onClick: () => setOpen(false),
					children: "Đóng"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				size: "sm",
				className: "mt-3 w-full",
				onClick: () => void advanceDemo(),
				children: "Tua nhanh 30 phút"
			}),
			persona === "ADMIN" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				size: "sm",
				className: "mt-2 w-full",
				onClick: () => void resetWorld(),
				children: "Reset dữ liệu"
			}) : null
		]
	});
}
function RoleGate({ allow, children }) {
	const hydrated = useBookingStore((state) => state.hydrated);
	const persona = useBookingStore((state) => state.persona);
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-lg px-4 py-24 text-center text-muted",
		children: "Đang mở dữ liệu…"
	});
	if (!allow.includes(persona)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		lang: "vi",
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-title",
				children: "Cần đúng link vai trò"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-ink-soft",
				children: "Trang này không mở bằng vai đang lưu trên thiết bị. Dùng link được gửi cho bạn."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/admin/links",
					children: "Xem danh sách link"
				})
			})
		]
	});
	return children;
}
var styles_default = "/assets/styles-CRJZldV9.css";
var APP_NAME = "Stayora";
function HydrateStore() {
	const refreshWorld = useBookingStore((state) => state.refreshWorld);
	const applyVaiFromUrl = useBookingStore((state) => state.applyVaiFromUrl);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const persistApi = useBookingStore.persist;
		const boot = async () => {
			if (!persistApi.hasHydrated()) await persistApi.rehydrate();
			if (cancelled) return;
			const role = applyVaiFromUrl();
			await refreshWorld();
			if (cancelled || !role) return;
			const dest = workspaceFor(role.persona);
			if (window.location.pathname === "/" && dest !== "/") navigate({ to: dest });
		};
		boot();
		const id = window.setInterval(() => {
			useBookingStore.getState().refreshWorld();
		}, 5e3);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [
		applyVaiFromUrl,
		navigate,
		refreshWorld
	]);
	return null;
}
var Route$9 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Stayora — private villas at Oceanami, Phước Hải. Chủ nhà sẽ xem và phản hồi."
			},
			{
				name: "theme-color",
				content: "#F6F1EA"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "min-h-dvh bg-cream font-sans text-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HydrateStore, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-dvh flex-col",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DemoPanel, {})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$8 = () => import("./routes-CQQcH8Kq.mjs");
var Route$8 = createFileRoute("/")({
	validateSearch: parseStaySearch,
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./admin-C67IbtG8.mjs");
var Route$7 = createFileRoute("/admin")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./host-CYhgg0Yt.mjs");
var Route$6 = createFileRoute("/host")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./ops-gMDctz5r.mjs");
var Route$5 = createFileRoute("/ops")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./sale-B0BImkqf.mjs");
var Route$4 = createFileRoute("/sale")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./admin_.links-CK0iO6Cb.mjs");
var Route$3 = createFileRoute("/admin_/links")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./requests._requestId-BLWVqTAW.mjs");
var Route$2 = createFileRoute("/requests/$requestId")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./villas._villaId-MANX89r1.mjs");
var Route$1 = createFileRoute("/villas/$villaId")({
	validateSearch: parseStaySearch,
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./your-stay._stayId-DiQMl8E8.mjs");
var Route = createFileRoute("/your-stay/$stayId")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var rootRouteChildren = {
	IndexRoute: Route$8.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$9
	}),
	AdminRoute: Route$7.update({
		id: "/admin",
		path: "/admin",
		getParentRoute: () => Route$9
	}),
	HostRoute: Route$6.update({
		id: "/host",
		path: "/host",
		getParentRoute: () => Route$9
	}),
	OpsRoute: Route$5.update({
		id: "/ops",
		path: "/ops",
		getParentRoute: () => Route$9
	}),
	SaleRoute: Route$4.update({
		id: "/sale",
		path: "/sale",
		getParentRoute: () => Route$9
	}),
	AdminLinksRoute: Route$3.update({
		id: "/admin_/links",
		path: "/admin/links",
		getParentRoute: () => Route$9
	}),
	RequestsRequestIdRoute: Route$2.update({
		id: "/requests/$requestId",
		path: "/requests/$requestId",
		getParentRoute: () => Route$9
	}),
	VillasVillaIdRoute: Route$1.update({
		id: "/villas/$villaId",
		path: "/villas/$villaId",
		getParentRoute: () => Route$9
	}),
	YourStayStayIdRoute: Route.update({
		id: "/your-stay/$stayId",
		path: "/your-stay/$stayId",
		getParentRoute: () => Route$9
	})
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { nightsBetween as _, Route$8 as a, cn as b, bedroomLabel as c, disabledMatchers as d, formatDateRange as f, nightLabel as g, isIsoDate as h, Route$2 as i, bookability as l, guestLabel as m, Route as n, RoleGate as o, formatVnd as p, Route$1 as r, StayoraIcon as s, router_exports as t, bookabilityCopy as u, useBookingStore as v, Button as y };

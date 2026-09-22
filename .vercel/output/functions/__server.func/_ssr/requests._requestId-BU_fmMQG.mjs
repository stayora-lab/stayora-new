import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { T as useBookingStore, f as formatLongDate, h as guestLabel, m as getVilla } from "./store-DTEBiuLL.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-Cj0Y92zJ.mjs";
import { b as Check, g as Clock } from "../_libs/lucide-react.mjs";
import { b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Route$2 } from "./router-BGy6B_af.mjs";
import { t as StaySummary } from "./stay-summary-OEbMa8By.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/requests._requestId-BU_fmMQG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RequestPage() {
	const { requestId } = Route$2.useParams();
	const navigate = useNavigate();
	const hydrated = useBookingStore((state) => state.hydrated);
	const request = useBookingStore((state) => state.world.requests.find((item) => item.id === requestId));
	const confirmRequest = useBookingStore((state) => state.confirmRequest);
	const [checking, setChecking] = (0, import_react.useState)(false);
	const [updateReady, setUpdateReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!request || request.status === "CONFIRMED") return;
		const timer = window.setTimeout(() => setUpdateReady(true), 5e3);
		return () => window.clearTimeout(timer);
	}, [request]);
	function applyConfirmation() {
		confirmRequest(requestId);
		setUpdateReady(false);
	}
	function checkForUpdate() {
		setChecking(true);
		window.setTimeout(() => {
			applyConfirmation();
			setChecking(false);
		}, 800);
	}
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "mx-auto max-w-lg px-4 py-24 text-muted",
		children: "Loading your request…"
	});
	if (!request) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-title",
				children: "We can't find that request"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-ink-soft",
				children: "It may have been from another session on this device."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "Browse Oceanami"
				})
			})
		]
	});
	const villa = getVilla(request.villaId);
	if (!villa) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg px-4 py-24 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-serif text-title",
			children: "This stay is no longer listed"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Browse Oceanami"
			})
		})]
	});
	if (request.status === "CONFIRMED") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg px-4 py-12 sm:py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-12 items-center justify-center rounded-full bg-lotus-soft text-lotus",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs font-semibold tracking-wider text-lotus uppercase",
				children: "Confirmed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-serif text-title",
				children: "Your stay is confirmed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-ink-soft",
				children: [
					villa.name,
					" is reserved for ",
					guestLabel(request.guests),
					", ",
					formatLongDate(request.checkIn),
					" ",
					"to ",
					formatLongDate(request.checkOut),
					"."
				]
			}),
			request.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 text-sm text-muted",
				children: ["Confirmation ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-ink",
					children: request.reference
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaySummary, {
					villa,
					request
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-3 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "What happens next"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm text-ink-soft",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Arrival notes will be shared before you travel." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Open your stay for directions and the villa guide." })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					className: "w-full",
					onClick: () => navigate({
						to: "/your-stay/$stayId",
						params: { stayId: request.stayId ?? request.id }
					}),
					children: "Open your stay"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "ghost",
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/villas/$villaId",
						params: { villaId: villa.id },
						children: "Back to the villa"
					})
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-lg px-4 py-12 sm:py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex size-12 items-center justify-center rounded-full bg-cream-deep text-ink",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs font-semibold tracking-wider text-muted uppercase",
				children: "Request sent"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-serif text-title",
				children: "We've sent your request"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-ink-soft",
				children: [
					"Oceanami will review this stay and confirm if ",
					villa.name,
					" can welcome you for these dates. You'll see the update here."
				]
			}),
			updateReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 rounded-2xl bg-lotus-soft p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium text-lotus-deep",
					children: "There's an update on your request."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-3",
					onClick: applyConfirmation,
					children: "See the update"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaySummary, {
					villa,
					request
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "mt-8 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						done: true,
						title: "Request sent",
						body: "Oceanami has your dates and guest count."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						current: true,
						title: "Waiting for confirmation",
						body: "This is not a confirmed stay yet. We'll update this page when it is."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						title: "Your stay",
						body: "After confirmation, you can open your stay guide."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-10 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					variant: "outline",
					className: "w-full",
					disabled: checking,
					onClick: checkForUpdate,
					children: checking ? "Checking…" : "Check for an update"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "ghost",
					className: "w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/villas/$villaId",
						params: { villaId: villa.id },
						children: "Back to the villa"
					})
				})]
			})
		]
	});
}
function Step({ title, body, done, current }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `mt-1 size-2.5 shrink-0 rounded-full ${done ? "bg-lotus" : current ? "bg-ink" : "bg-sand"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: body
		})] })]
	});
}
//#endregion
export { RequestPage as component };

import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { i as parseISO } from "../_libs/date-fns.mjs";
import { _ as isIsoDate, d as formatDateRange, h as guestLabel, l as cn, u as disabledMatchers } from "./store-CN_mVyeU.mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as Button } from "./button-B_fynA1P.mjs";
import { d as Plus, f as Minus, v as ChevronDown } from "../_libs/lucide-react.mjs";
import { t as Drawer } from "../_libs/vaul.mjs";
import { t as DayPicker } from "../_libs/react-day-picker.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dates-guests-BRl-HRjS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Popover = Root2;
var PopoverTrigger = Trigger;
function PopoverContent({ className, align = "start", sideOffset = 8, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
		align,
		sideOffset,
		className: cn("z-50 origin-[--radix-popover-content-transform-origin] rounded-xl bg-paper p-3 text-ink shadow-[var(--shadow-lift)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", className),
		...props
	}) });
}
function useIsMobile(query = "(max-width: 767px)") {
	const [isMobile, setIsMobile] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const media = window.matchMedia(query);
		const update = () => setIsMobile(media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, [query]);
	return isMobile;
}
function toRange(checkIn, checkOut) {
	if (!isIsoDate(checkIn)) return void 0;
	return {
		from: parseISO(checkIn),
		to: isIsoDate(checkOut) ? parseISO(checkOut) : void 0
	};
}
function toIsoDate(date) {
	if (!date) return "";
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function fromRange(range) {
	return {
		checkIn: toIsoDate(range?.from),
		checkOut: toIsoDate(range?.to)
	};
}
function CalendarBody({ villa, world, selected, onSelect, months, locale }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPicker, {
		mode: "range",
		selected,
		onSelect,
		numberOfMonths: months,
		disabled: disabledMatchers(villa, world),
		defaultMonth: selected?.from,
		locale
	});
}
function DateRangeField({ checkIn, checkOut, onChange, villa, world, align = "start", className, datesLabel = "Dates", calendarTitle = "When would you like to stay?", placeholder = "Add dates", formatLabel, locale }) {
	const isMobile = useIsMobile();
	const [open, setOpen] = (0, import_react.useState)(false);
	const selected = toRange(checkIn, checkOut);
	const label = isIsoDate(checkIn) && isIsoDate(checkOut) ? formatLabel ? formatLabel(checkIn, checkOut) : formatDateRange(checkIn, checkOut) : placeholder;
	function handleSelect(range) {
		const next = fromRange(range);
		onChange(next);
		if (next.checkIn && next.checkOut && next.checkIn !== next.checkOut) setOpen(false);
	}
	const trigger = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: cn("flex h-14 w-full min-w-0 flex-col items-start justify-center rounded-full px-5 text-left transition-colors hover:bg-cream-deep", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-semibold tracking-wider text-muted uppercase",
			children: datesLabel
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex w-full items-center justify-between gap-2 font-medium",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted" })]
		})]
	});
	if (isMobile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Root, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Trigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
			className: "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-4 pb-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 font-serif text-2xl",
					children: calendarTitle
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarBody, {
					villa,
					world,
					selected,
					onSelect: handleSelect,
					months: 1,
					locale
				})
			]
		})] })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
			align,
			className: "w-auto p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarBody, {
				villa,
				world,
				selected,
				onSelect: handleSelect,
				months: 2,
				locale
			})
		})]
	});
}
function DateField({ date, onChange, label = "Date", calendarTitle = "Pick a date", formatLabel, locale, className }) {
	const isMobile = useIsMobile();
	const [open, setOpen] = (0, import_react.useState)(false);
	const selected = isIsoDate(date) ? parseISO(date) : void 0;
	const display = isIsoDate(date) ? formatLabel ? formatLabel(date) : date : "Chọn ngày";
	function handleSelect(next) {
		if (!next) return;
		onChange(toIsoDate(next));
		setOpen(false);
	}
	const calendar = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPicker, {
		mode: "single",
		selected,
		onSelect: handleSelect,
		defaultMonth: selected,
		locale
	});
	const trigger = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: cn("flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-full bg-paper px-5 text-left shadow-[var(--shadow-border)]", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs font-semibold tracking-wider text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-medium",
			children: display
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted" })]
	});
	if (isMobile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Root, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Trigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
			className: "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-4 pb-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 font-serif text-2xl",
					children: calendarTitle
				}),
				calendar
			]
		})] })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
			align: "start",
			className: "w-auto p-4",
			children: calendar
		})]
	});
}
function GuestField({ guests, onChange, max = 16, className, label = "Guests", heading = "Who is coming?", peopleLabel = "Guests", peopleHint = "Everyone staying in the villa.", doneLabel = "Done", valueLabel }) {
	const isMobile = useIsMobile();
	const [open, setOpen] = (0, import_react.useState)(false);
	const shown = valueLabel ? valueLabel(guests) : guestLabel(guests);
	const controls = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-6 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: peopleLabel
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: peopleHint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stepper, {
			value: guests,
			min: 1,
			max,
			onChange
		})]
	});
	const trigger = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: cn("flex h-14 w-full min-w-0 flex-col items-start justify-center rounded-full px-5 text-left transition-colors hover:bg-cream-deep", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-semibold tracking-wider text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex w-full items-center justify-between gap-2 font-medium",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate",
				children: shown
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 shrink-0 text-muted" })]
		})]
	});
	if (isMobile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Root, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Trigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Portal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Drawer.Overlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Drawer.Content, {
			className: "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-12 rounded-full bg-sand" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4 font-serif text-2xl",
					children: heading
				}),
				controls,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-6 w-full",
					onClick: () => setOpen(false),
					children: doneLabel
				})
			]
		})] })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: trigger
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
			align: "end",
			className: "w-80 p-4",
			children: controls
		})]
	});
}
function Stepper({ value, min, max, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Decrease guests",
				disabled: value <= min,
				onClick: () => onChange(Math.max(min, value - 1)),
				className: "flex size-10 items-center justify-center rounded-full shadow-[var(--shadow-border)] disabled:opacity-30",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-6 text-center font-medium tabular-nums",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Increase guests",
				disabled: value >= max,
				onClick: () => onChange(Math.min(max, value + 1)),
				className: "flex size-10 items-center justify-center rounded-full shadow-[var(--shadow-border)] disabled:opacity-30",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
			})
		]
	});
}
function FieldSplit({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-w-0 flex-1 items-stretch divide-x divide-border",
		children
	});
}
//#endregion
export { GuestField as i, DateRangeField as n, FieldSplit as r, DateField as t };

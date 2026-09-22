import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { x as Slot } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { A as differenceInCalendarDays, F as addDays, c as isAfter, d as format, i as parseISO, j as startOfDay } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-Cjzu5u-8.js
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
var DomainError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "DomainError";
		this.code = code;
	}
};
/**
* DEMO ASSUMPTION pending Founder decision: the hold keeps running during UNKNOWN.
*/
var HOLD_MS = 18e5;
var COMMISSION_RATE = .1;
var PILOT_NOW = "2026-09-22T03:00:00.000Z";
/** DEMO ASSUMPTION */
var CHECK_IN_TIME = "14:00";
/** DEMO ASSUMPTION */
var TIMEZONE = "Asia/Ho_Chi_Minh";
var DESTINATION = {
	name: "Oceanami",
	region: "Phước Hải, Bà Rịa–Vũng Tàu",
	country: "Việt Nam",
	travel: "About 2½ hours from Ho Chi Minh City by car",
	address: "QL44A, Phước Hải, Đất Đỏ, Bà Rịa–Vũng Tàu",
	intro: "A quiet stretch of Phước Hải beach, with Minh Đạm mountain at its back. Private villas sit in tropical gardens, a short walk from the sand and the beach club."
};
var villas = [
	{
		id: "sao-bien",
		name: "Villa Sao Biển",
		tagline: "Four bedrooms, an infinity pool, and the sea at the garden edge.",
		summary: "Beachfront villa with a linear pool that meets the East Sea.",
		description: ["Sao Biển sits on the first line of Oceanami, with a long limestone deck and an infinity pool that visually joins the water. Mornings here are about the horizon; afternoons, about shade and the slow walk to the sand.", "The house opens completely to the garden. Four bedrooms are split across two wings, so a family or two couples can keep their own quiet without losing the shared table."],
		setting: "beachfront",
		settingLabel: "Beachfront",
		bedrooms: 4,
		bathrooms: 4,
		sleeps: 8,
		sqm: 320,
		nightly: 165e5,
		amenities: [
			"pool",
			"beach",
			"kitchen",
			"bbq",
			"wifi",
			"air",
			"club",
			"housekeeping",
			"parking",
			"washer"
		],
		sleeping: [
			{
				title: "Ocean suite",
				detail: "King bed, sea view, ensuite"
			},
			{
				title: "Garden suite",
				detail: "King bed, garden view, ensuite"
			},
			{
				title: "Twin room",
				detail: "Two single beds, ensuite"
			},
			{
				title: "Pool room",
				detail: "Queen bed, opens to the deck"
			}
		],
		images: [
			{
				src: "/images/villas/sao-bien-hero.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/sao-bien-living.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/beach-club.jpg",
				alt: "Ảnh minh hoạ"
			}
		]
	},
	{
		id: "huong-tram",
		name: "Villa Hương Tràm",
		tagline: "A garden house for six, screened in timber and tropical green.",
		summary: "Secluded three-bedroom villa in a dense garden, with a private pool.",
		description: ["Hương Tràm is held in the trees. Dark timber screens and a green pool keep the house cool, and the garden swallows sound from the path. It is the villa people choose when they want Oceanami without sitting on the sand.", "The dining table looks into the foliage. Three bedrooms share a single generous living room — right for a family, or three friends who still want their own door."],
		setting: "garden",
		settingLabel: "Garden",
		bedrooms: 3,
		bathrooms: 3,
		sleeps: 6,
		sqm: 240,
		nightly: 94e5,
		amenities: [
			"pool",
			"kitchen",
			"wifi",
			"air",
			"club",
			"housekeeping",
			"parking",
			"washer",
			"workspace"
		],
		sleeping: [
			{
				title: "Main suite",
				detail: "King bed, garden view, ensuite"
			},
			{
				title: "Verandah room",
				detail: "Queen bed, opens to the pool"
			},
			{
				title: "Twin room",
				detail: "Two single beds, ensuite"
			}
		],
		images: [
			{
				src: "/images/villas/huong-tram-hero.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/huong-tram-living.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/spa.jpg",
				alt: "Ảnh minh hoạ"
			}
		]
	},
	{
		id: "minh-dam",
		name: "Villa Minh Đạm",
		tagline: "Five bedrooms on the hill, with the sea in front and the mountain behind.",
		summary: "The largest house — dual views, a wide terrace, and room for ten.",
		description: ["Named for the mountain it leans against, Minh Đạm is the lookout. The terrace holds a long table and a view that splits sea from forest. It is the villa for a reunion, a multi-family stay, or anyone who wants height and quiet.", "Five bedrooms step down the slope. Sunset is the event; the rest of the day can be the pool, the beach club, or not leaving the terrace at all."],
		setting: "hillside",
		settingLabel: "Hillside",
		bedrooms: 5,
		bathrooms: 5,
		sleeps: 10,
		sqm: 480,
		nightly: 224e5,
		amenities: [
			"pool",
			"kitchen",
			"bbq",
			"wifi",
			"air",
			"club",
			"housekeeping",
			"parking",
			"washer",
			"workspace",
			"baths"
		],
		sleeping: [
			{
				title: "Lookout suite",
				detail: "King bed, sea and mountain view"
			},
			{
				title: "East suite",
				detail: "King bed, sea view, ensuite"
			},
			{
				title: "Forest suite",
				detail: "King bed, mountain view"
			},
			{
				title: "Twin room",
				detail: "Two single beds"
			},
			{
				title: "Garden room",
				detail: "Queen bed, lower terrace"
			}
		],
		images: [
			{
				src: "/images/villas/minh-dam-hero.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/minh-dam-terrace.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/oceanami-hero.jpg",
				alt: "Ảnh minh hoạ"
			}
		]
	},
	{
		id: "sen-hong",
		name: "Villa Sen Hồng",
		tagline: "Two bedrooms around a lotus courtyard — small, still, and close.",
		summary: "An intimate courtyard villa for two to four, built around water.",
		description: ["Sen Hồng is the smallest house in this collection, and the most inward. A lotus pond holds the courtyard; the rooms look at water and plaster rather than the open sea. Couples stay here. So do close friends who want a quieter rhythm than a beachfront deck.", "The beach is still a short walk. What you give up in horizon, you gain in hush."],
		setting: "garden",
		settingLabel: "Courtyard",
		bedrooms: 2,
		bathrooms: 2,
		sleeps: 4,
		sqm: 160,
		nightly: 62e5,
		amenities: [
			"pool",
			"kitchen",
			"wifi",
			"air",
			"club",
			"housekeeping",
			"parking",
			"baths"
		],
		sleeping: [{
			title: "Courtyard suite",
			detail: "King bed, pond view, ensuite"
		}, {
			title: "Upper room",
			detail: "Queen bed, garden window"
		}],
		images: [
			{
				src: "/images/villas/sen-hong-hero.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/sen-hong-courtyard.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/spa.jpg",
				alt: "Ảnh minh hoạ"
			}
		]
	},
	{
		id: "gio-bien",
		name: "Villa Gió Biển",
		tagline: "A bright family house with a generous pool and a proper kitchen.",
		summary: "Three-bedroom family villa near the beach club, built for a full table.",
		description: ["Gió Biển is the practical luxury house: a shallow sun shelf in the pool, a kitchen that actually works for eight, and a lawn where children can disappear for an hour. The beach club is close enough that no one has to drive.", "Adults still get a quiet main suite. The rest of the house is sociable on purpose."],
		setting: "garden",
		settingLabel: "Near the beach club",
		bedrooms: 3,
		bathrooms: 3,
		sleeps: 6,
		sqm: 260,
		nightly: 108e5,
		amenities: [
			"pool",
			"kitchen",
			"bbq",
			"wifi",
			"air",
			"club",
			"housekeeping",
			"parking",
			"shower",
			"washer"
		],
		sleeping: [
			{
				title: "Main suite",
				detail: "King bed, garden view, ensuite"
			},
			{
				title: "Pool room",
				detail: "Queen bed, opens to the deck"
			},
			{
				title: "Twin room",
				detail: "Two single beds, garden view"
			}
		],
		images: [
			{
				src: "/images/villas/gio-bien-hero.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/gio-bien-living.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/beach-club.jpg",
				alt: "Ảnh minh hoạ"
			}
		]
	},
	{
		id: "cat-vang",
		name: "Villa Cát Vàng",
		tagline: "Steps from the sand, with an outdoor kitchen and the sea as a neighbour.",
		summary: "Four-bedroom pavilion villa, a few paces from Phước Hải beach.",
		description: ["Cát Vàng lives on the sand side of Oceanami. A timber pavilion holds the living and the outdoor kitchen; the pool sits between the house and a low hedge, and then it is beach. Barefoot is the dress code.", "Four bedrooms make it easy for two families. Evenings collect around the grill; mornings, around the water."],
		setting: "beachfront",
		settingLabel: "On the sand",
		bedrooms: 4,
		bathrooms: 4,
		sleeps: 8,
		sqm: 340,
		nightly: 182e5,
		amenities: [
			"pool",
			"beach",
			"kitchen",
			"bbq",
			"wifi",
			"air",
			"club",
			"housekeeping",
			"parking",
			"shower",
			"washer"
		],
		sleeping: [
			{
				title: "Pavilion suite",
				detail: "King bed, sea breeze, ensuite"
			},
			{
				title: "Garden suite",
				detail: "King bed, ensuite"
			},
			{
				title: "Twin room",
				detail: "Two single beds"
			},
			{
				title: "Pool room",
				detail: "Queen bed, deck access"
			}
		],
		images: [
			{
				src: "/images/villas/cat-vang-hero.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/cat-vang-pool.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/sao-bien-living.jpg",
				alt: "Ảnh minh hoạ"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Ảnh minh hoạ"
			}
		]
	}
];
function getVilla(id) {
	return villas.find((villa) => villa.id === id);
}
var AMENITY_LABELS = {
	pool: "Private pool",
	wifi: "Wifi",
	kitchen: "Full kitchen",
	beach: "Direct beach access",
	air: "Air conditioning",
	parking: "Private parking",
	bbq: "Outdoor kitchen",
	washer: "Washer",
	shower: "Outdoor shower",
	club: "Beach club access",
	housekeeping: "Daily housekeeping",
	workspace: "Work desk",
	baths: "Deep soaking tub"
};
var SALE_MAI = "sale-mai";
var BUTLER_LINH = "butler-linh";
var OFFSET_BY_ZONE = { "Asia/Ho_Chi_Minh": "+07:00" };
function checkInInstant(checkIn) {
	const offset = OFFSET_BY_ZONE["Asia/Ho_Chi_Minh"] ?? "+07:00";
	return /* @__PURE__ */ new Date(`${checkIn}T${CHECK_IN_TIME}:00${offset}`);
}
/** DEMO ASSUMPTION: evaluatedAt is Request.createdAt. */
function paymentPlan(total, checkIn, evaluatedAt) {
	const checkInMs = checkInInstant(checkIn).getTime();
	if (checkInMs - parseISO(evaluatedAt).getTime() > 864e5) {
		const initial = Math.round(total / 2);
		return [{
			kind: "INITIAL",
			amount: initial,
			dueAt: evaluatedAt
		}, {
			kind: "BALANCE",
			amount: total - initial,
			dueAt: (/* @__PURE__ */ new Date(checkInMs - 864e5)).toISOString()
		}];
	}
	return [{
		kind: "INITIAL",
		amount: total,
		dueAt: evaluatedAt
	}];
}
function paymentPlanLabel(total, checkIn, evaluatedAt) {
	return paymentPlan(total, checkIn, evaluatedAt).length === 2 ? "50/50" : "100%";
}
function nightsBetween$1(checkIn, checkOut) {
	return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}
function requireVilla(villaId) {
	const villa = getVilla(villaId);
	if (!villa) throw new Error(`Unknown villa ${villaId}`);
	return villa;
}
function rangesOverlap(start, end, otherStart, otherEnd) {
	return start < otherEnd && end > otherStart;
}
function isHoldActive(commitment, now) {
	if (commitment.kind !== "HOLD") return false;
	if (commitment.status !== "ACTIVE") return false;
	if (commitment.expiresAt && commitment.expiresAt <= now) return false;
	return true;
}
function activeCommitments(world) {
	return world.commitments.filter((commitment) => {
		if (commitment.status !== "ACTIVE") return false;
		if (commitment.kind === "HOLD" && !isHoldActive(commitment, world.now)) return false;
		return true;
	});
}
function isAvailable(world, villaId, checkIn, checkOut) {
	if (nightsBetween$1(checkIn, checkOut) < 1) return false;
	try {
		requireVilla(villaId);
	} catch {
		return false;
	}
	return !activeCommitments(world).some((commitment) => commitment.villaId === villaId && rangesOverlap(checkIn, checkOut, commitment.start, commitment.end));
}
function occupiedRanges(world, villaId) {
	return activeCommitments(world).filter((commitment) => commitment.villaId === villaId).map((commitment) => ({
		start: commitment.start,
		end: commitment.end
	}));
}
function commitmentsOnDate(world, villaId, date) {
	return activeCommitments(world).filter((commitment) => commitment.villaId === villaId && commitment.start <= date && date < commitment.end);
}
function openConflictsCovering(world, villaId, start, end) {
	return (world.conflicts ?? []).filter((conflict) => {
		if (conflict.status !== "OPEN" || conflict.villaId !== villaId) return false;
		return conflict.commitmentIds.some((id) => {
			const commitment = world.commitments.find((item) => item.id === id);
			return commitment ? rangesOverlap(start, end, commitment.start, commitment.end) : false;
		});
	});
}
function nid(prefix) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
function reference(prefix = "STY") {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let token = "";
	for (let i = 0; i < 4; i += 1) token += alphabet[Math.floor(Math.random() * 32)];
	return `${prefix}-${token}`;
}
function requireRequest(world, requestId) {
	const request = world.requests.find((item) => item.id === requestId);
	if (!request) throw new DomainError("NOT_FOUND", "Request not found");
	return request;
}
function requireStay(world, stayId) {
	const stay = world.stays.find((item) => item.id === stayId);
	if (!stay) throw new DomainError("NOT_FOUND", "Stay not found");
	return stay;
}
function requireObligation(world, obligationId) {
	const obligation = world.obligations.find((item) => item.id === obligationId);
	if (!obligation) throw new DomainError("NOT_FOUND", "Obligation not found");
	return obligation;
}
function requireCommitment(world, commitmentId) {
	const commitment = world.commitments.find((item) => item.id === commitmentId);
	if (!commitment) throw new DomainError("NOT_FOUND", "Commitment not found");
	return commitment;
}
function assertHost(actor) {
	if (actor.persona !== "HOST") throw new DomainError("FORBIDDEN", "Only Host can do this");
}
function assertAdmin(actor) {
	if (actor.persona !== "ADMIN") throw new DomainError("FORBIDDEN", "Only Stayora vận hành can record payment");
}
function assertButlerAssigned(world, actor, villaId) {
	if (actor.persona !== "BUTLER") throw new DomainError("FORBIDDEN", "Only a Butler can change a Stay");
	if (!world.butlers.find((person) => person.id === actor.butlerId)?.villaIds?.includes(villaId)) throw new DomainError("NOT_ASSIGNED", "This villa is not assigned to this Butler");
}
function replaceRequest(world, request) {
	return {
		...world,
		requests: world.requests.map((item) => item.id === request.id ? request : item)
	};
}
function replaceStay(world, stay) {
	return {
		...world,
		stays: world.stays.map((item) => item.id === stay.id ? stay : item)
	};
}
function withAudit(world, actor, action, objectId, reason) {
	const entry = {
		id: nid("aud"),
		at: world.now,
		persona: actor.persona,
		action,
		objectId,
		reason
	};
	return {
		...world,
		auditLog: [entry, ...world.auditLog ?? []]
	};
}
function hasUnresolvedUnknown(world, obligationId) {
	return world.attempts.some((attempt) => attempt.obligationId === obligationId && attempt.status === "UNKNOWN");
}
function activeHoldFor(world, requestId) {
	return world.commitments.find((commitment) => commitment.kind === "HOLD" && commitment.requestId === requestId && isHoldActive(commitment, world.now));
}
function makeRefund(world, input) {
	const refund = {
		id: nid("ref"),
		requestId: input.requestId,
		attemptId: input.attemptId,
		amount: input.amount,
		reason: input.reason,
		status: "OPEN",
		createdAt: world.now
	};
	return {
		world: {
			...world,
			refundCases: [refund, ...world.refundCases ?? []]
		},
		refund
	};
}
function expireHolds(world) {
	let changed = false;
	const commitments = world.commitments.map((commitment) => {
		if (commitment.kind === "HOLD" && commitment.status === "ACTIVE" && commitment.expiresAt && commitment.expiresAt <= world.now) {
			changed = true;
			return {
				...commitment,
				status: "ENDED",
				endedReason: "EXPIRED"
			};
		}
		return commitment;
	});
	const expiredHoldRequestIds = new Set(commitments.filter((commitment) => commitment.kind === "HOLD" && commitment.status === "ENDED" && commitment.endedReason === "EXPIRED" && commitment.requestId).map((commitment) => commitment.requestId));
	const bookedRequestIds = new Set(world.bookings.filter((booking) => booking.status === "CONFIRMED").map((booking) => booking.requestId));
	const requests = world.requests.map((request) => {
		if (request.status === "ACCEPTED" && expiredHoldRequestIds.has(request.id) && !bookedRequestIds.has(request.id)) {
			changed = true;
			return {
				...request,
				status: "EXPIRED",
				expiredAt: world.now
			};
		}
		return request;
	});
	if (!changed) return world;
	return {
		...world,
		commitments,
		requests
	};
}
function advanceTime(world, ms) {
	const now = new Date(parseISO(world.now).getTime() + ms).toISOString();
	return expireHolds({
		...world,
		now
	});
}
function createEmptyWorld(now) {
	return {
		now,
		requests: [],
		bookings: [],
		stays: [],
		commitments: [],
		incidents: [],
		commissions: [],
		obligations: [],
		attempts: [],
		refundCases: [],
		conflicts: [],
		auditLog: [],
		externalAccommodations: [],
		sales: [{
			id: SALE_MAI,
			name: "Mai"
		}],
		butlers: [{
			id: BUTLER_LINH,
			name: "Linh",
			villaIds: [
				"sao-bien",
				"gio-bien",
				"cat-vang"
			]
		}]
	};
}
function createRequest(world, input) {
	world = expireHolds(world);
	if (input.actor.persona !== "GUEST" && input.actor.persona !== "SALE") throw new DomainError("FORBIDDEN", "Only Guest or Sale can create a request");
	const villa = requireVilla(input.villaId);
	const nights = nightsBetween$1(input.checkIn, input.checkOut);
	if (nights < 1) throw new DomainError("INVALID", "Check-out must be after check-in");
	if (input.guests > villa.sleeps) throw new DomainError("TOO_MANY_GUESTS", `Sleeps up to ${villa.sleeps}`);
	if (!isAvailable(world, input.villaId, input.checkIn, input.checkOut)) throw new DomainError("NOT_AVAILABLE", "Not available for these dates");
	const source = input.actor.persona === "SALE" ? "SALE" : "GUEST";
	const saleId = input.actor.persona === "SALE" ? input.actor.saleId : void 0;
	const request = {
		id: input.id ?? nid("req"),
		villaId: input.villaId,
		checkIn: input.checkIn,
		checkOut: input.checkOut,
		guests: input.guests,
		guestName: input.guestName.trim() || "Khách",
		nightly: villa.nightly,
		nights,
		total: villa.nightly * nights,
		source,
		saleId,
		status: "PENDING",
		createdAt: world.now
	};
	return {
		world: withAudit({
			...world,
			requests: [request, ...world.requests]
		}, input.actor, "CREATE_REQUEST", request.id),
		request
	};
}
function acceptRequest(world, input) {
	world = expireHolds(world);
	assertHost(input.actor);
	const current = requireRequest(world, input.requestId);
	if (current.status !== "PENDING") throw new DomainError("INVALID_TRANSITION", "Only a pending request can be accepted");
	if (!isAvailable(world, current.villaId, current.checkIn, current.checkOut)) {
		const request = {
			...current,
			status: "CONFLICTED",
			conflictedAt: world.now
		};
		return {
			world: withAudit(replaceRequest(world, request), input.actor, "ACCEPT_REQUEST", request.id),
			request
		};
	}
	const holdExpiresAt = new Date(parseISO(world.now).getTime() + HOLD_MS).toISOString();
	const request = {
		...current,
		status: "ACCEPTED",
		acceptedAt: world.now,
		holdExpiresAt
	};
	const hold = {
		id: nid("hold"),
		villaId: request.villaId,
		start: request.checkIn,
		end: request.checkOut,
		kind: "HOLD",
		status: "ACTIVE",
		expiresAt: holdExpiresAt,
		basis: "STAYORA_BOOKING",
		requestId: request.id,
		createdBy: "HOST",
		createdAt: world.now
	};
	const obligations = [...world.obligations, ...paymentPlan(request.total, request.checkIn, request.createdAt).map((line) => ({
		id: nid("obl"),
		requestId: request.id,
		kind: line.kind,
		amount: line.amount,
		dueAt: line.dueAt
	}))];
	return {
		world: withAudit({
			...replaceRequest(world, request),
			commitments: [...world.commitments, hold],
			obligations
		}, input.actor, "ACCEPT_REQUEST", request.id),
		request
	};
}
function fulfillInitialSuccess(world, obligation, hold, actor) {
	const request = requireRequest(world, obligation.requestId);
	const bookingId = nid("bkg");
	const stayId = nid("sty");
	const ref = reference();
	const booking = {
		id: bookingId,
		requestId: request.id,
		stayId,
		villaId: request.villaId,
		reference: ref,
		checkIn: request.checkIn,
		checkOut: request.checkOut,
		guests: request.guests,
		guestName: request.guestName,
		nightly: request.nightly,
		nights: request.nights,
		total: request.total,
		saleId: request.saleId,
		status: "CONFIRMED",
		confirmedAt: world.now
	};
	const butler = world.butlers.find((person) => person.villaIds?.includes(request.villaId));
	const stay = {
		id: stayId,
		bookingId,
		requestId: request.id,
		villaId: request.villaId,
		checkIn: request.checkIn,
		checkOut: request.checkOut,
		guests: request.guests,
		guestName: request.guestName,
		origin: "STAYORA",
		originLabel: "Stayora",
		status: "SCHEDULED",
		assignedButlerId: butler?.id
	};
	const confirmed = {
		id: nid("cmt"),
		villaId: request.villaId,
		start: request.checkIn,
		end: request.checkOut,
		kind: "CONFIRMED_ACCOMMODATION",
		status: "ACTIVE",
		basis: "STAYORA_BOOKING",
		requestId: request.id,
		bookingId,
		stayId,
		reference: ref,
		createdBy: actor.persona,
		createdAt: world.now
	};
	const commissions = [...world.commissions];
	if (request.saleId) commissions.push({
		id: nid("com"),
		bookingId,
		stayId,
		saleId: request.saleId,
		amount: Math.round(request.total * COMMISSION_RATE),
		status: "PENDING"
	});
	return {
		world: {
			...world,
			bookings: [booking, ...world.bookings],
			stays: [stay, ...world.stays],
			commitments: [...world.commitments.map((item) => item.id === hold.id ? {
				...item,
				status: "ENDED",
				endedReason: "SUPERSEDED"
			} : item), confirmed],
			commissions
		},
		booking,
		stay
	};
}
function applyInitialSuccess(world, obligation, attempt, actor) {
	if (obligation.kind !== "INITIAL") return { world };
	if (world.bookings.some((booking) => booking.requestId === obligation.requestId && booking.status === "CONFIRMED")) return { world };
	const request = requireRequest(world, obligation.requestId);
	if (openConflictsCovering(world, request.villaId, request.checkIn, request.checkOut).length > 0) return makeRefund(world, {
		requestId: request.id,
		attemptId: attempt.id,
		amount: obligation.amount,
		reason: "INVENTORY_CONFLICT"
	});
	const hold = activeHoldFor(world, obligation.requestId);
	if (!hold) return makeRefund(world, {
		requestId: request.id,
		attemptId: attempt.id,
		amount: obligation.amount,
		reason: "HOLD_EXPIRED"
	});
	return fulfillInitialSuccess(world, obligation, hold, actor);
}
function finishPayment(world, actor, action, attempt, extra = {}) {
	return {
		world: withAudit(world, actor, action, extra.refund?.id ?? extra.booking?.id ?? attempt.id),
		attempt,
		booking: extra.booking,
		stay: extra.stay,
		refund: extra.refund
	};
}
function recordPayment(world, input) {
	world = expireHolds(world);
	assertAdmin(input.actor);
	const obligation = requireObligation(world, input.obligationId);
	if (obligation.kind === "BALANCE") {
		if (!world.bookings.some((booking) => booking.requestId === obligation.requestId && booking.status === "CONFIRMED")) throw new DomainError("NO_BOOKING_YET", "Balance cannot be recorded before a Booking exists");
	}
	if (hasUnresolvedUnknown(world, obligation.id)) throw new DomainError("ATTEMPT_UNRESOLVED", "An unknown attempt must be resolved first");
	const alreadyPaid = obligationSucceeded(world, obligation.id);
	const attempt = {
		id: nid("att"),
		obligationId: obligation.id,
		status: input.outcome,
		at: world.now
	};
	world = {
		...world,
		attempts: [attempt, ...world.attempts]
	};
	if (input.outcome === "SUCCEEDED" && alreadyPaid) {
		const refunded = makeRefund(world, {
			requestId: obligation.requestId,
			attemptId: attempt.id,
			amount: obligation.amount,
			reason: "DUPLICATE_PAYMENT"
		});
		return finishPayment(refunded.world, input.actor, "RECORD_PAYMENT", attempt, { refund: refunded.refund });
	}
	if (input.outcome !== "SUCCEEDED" || obligation.kind !== "INITIAL") return finishPayment(world, input.actor, "RECORD_PAYMENT", attempt);
	const applied = applyInitialSuccess(world, obligation, attempt, input.actor);
	return finishPayment(applied.world, input.actor, "RECORD_PAYMENT", attempt, applied);
}
function resolveUnknown(world, input) {
	world = expireHolds(world);
	assertAdmin(input.actor);
	const current = world.attempts.find((item) => item.id === input.attemptId);
	if (!current) throw new DomainError("NOT_FOUND", "Attempt not found");
	if (current.status !== "UNKNOWN") throw new DomainError("INVALID_TRANSITION", "Only an unknown attempt can be resolved");
	const obligation = requireObligation(world, current.obligationId);
	const alreadyPaid = obligationSucceeded(world, obligation.id);
	const attempt = {
		...current,
		status: input.outcome,
		at: world.now
	};
	world = {
		...world,
		attempts: world.attempts.map((item) => item.id === attempt.id ? attempt : item)
	};
	if (input.outcome !== "SUCCEEDED") return finishPayment(world, input.actor, "RESOLVE_UNKNOWN", attempt);
	if (alreadyPaid) {
		const refunded = makeRefund(world, {
			requestId: obligation.requestId,
			attemptId: attempt.id,
			amount: obligation.amount,
			reason: "DUPLICATE_PAYMENT"
		});
		return finishPayment(refunded.world, input.actor, "RESOLVE_UNKNOWN", attempt, { refund: refunded.refund });
	}
	const applied = applyInitialSuccess(world, obligation, attempt, input.actor);
	return finishPayment(applied.world, input.actor, "RESOLVE_UNKNOWN", attempt, applied);
}
function checkInStay(world, input) {
	world = expireHolds(world);
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	if (stay.status === "CANCELLED") throw new DomainError("INVALID_TRANSITION", "A cancelled stay cannot be checked in");
	if (stay.status !== "SCHEDULED") throw new DomainError("INVALID_TRANSITION", "Check-in is only possible from scheduled");
	const updated = {
		...stay,
		status: "CHECKED_IN",
		checkedInAt: world.now
	};
	return {
		world: withAudit(replaceStay(world, updated), input.actor, "CHECK_IN", updated.id),
		stay: updated
	};
}
function checkOutStay(world, input) {
	world = expireHolds(world);
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	if (stay.status === "CANCELLED") throw new DomainError("INVALID_TRANSITION", "A cancelled stay cannot be checked out");
	if (stay.status !== "CHECKED_IN") throw new DomainError("INVALID_TRANSITION", "Check-out is only possible after check-in");
	const completed = {
		...stay,
		status: "COMPLETED",
		checkedOutAt: world.now,
		completedAt: world.now
	};
	const commissions = world.commissions.map((item) => item.stayId === stay.id && item.status !== "VOID" ? {
		...item,
		status: "EARNED"
	} : item);
	return {
		world: withAudit({
			...replaceStay(world, completed),
			commissions
		}, input.actor, "CHECK_OUT", completed.id),
		stay: completed
	};
}
function markDidNotOccur(world, input) {
	world = expireHolds(world);
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	if (stay.status === "CHECKED_IN") throw new DomainError("INVALID_TRANSITION", "DID_NOT_OCCUR is refused after check-in");
	if (stay.status === "CANCELLED") throw new DomainError("INVALID_TRANSITION", "A cancelled stay cannot be marked did-not-occur");
	if (stay.status !== "SCHEDULED") throw new DomainError("INVALID_TRANSITION", "No-show is only possible from scheduled");
	if (!input.reason.trim()) throw new DomainError("MISSING_REASON", "A reason is required");
	const updated = {
		...stay,
		status: "DID_NOT_OCCUR",
		didNotOccurReason: input.reason.trim(),
		didNotOccurAt: world.now
	};
	return {
		world: withAudit(replaceStay(world, updated), input.actor, "DID_NOT_OCCUR", updated.id, input.reason.trim()),
		stay: updated
	};
}
function reportIncident(world, input) {
	world = expireHolds(world);
	if (input.actor.persona !== "BUTLER") throw new DomainError("FORBIDDEN", "Only a Butler can report an incident");
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	const incident = {
		id: nid("inc"),
		stayId: stay.id,
		villaId: stay.villaId,
		note: input.note.trim(),
		hasPhoto: input.hasPhoto,
		createdAt: world.now,
		createdBy: "BUTLER"
	};
	return { world: withAudit({
		...world,
		incidents: [incident, ...world.incidents]
	}, input.actor, "REPORT_INCIDENT", incident.id) };
}
function recordExternalBooking(world, input) {
	world = expireHolds(world);
	assertHost(input.actor);
	requireVilla(input.villaId);
	if (nightsBetween$1(input.checkIn, input.checkOut) < 1) throw new DomainError("INVALID", "Check-out must be after check-in");
	const overlapping = activeCommitments(world).filter((commitment) => commitment.villaId === input.villaId && rangesOverlap(input.checkIn, input.checkOut, commitment.start, commitment.end));
	const external = {
		id: nid("ext"),
		villaId: input.villaId,
		checkIn: input.checkIn,
		checkOut: input.checkOut,
		guests: input.guests,
		guestName: input.guestName?.trim() || void 0,
		source: input.source
	};
	const stayId = nid("sty");
	const commitmentId = nid("cmt");
	const ref = reference("EXT");
	const butler = world.butlers.find((person) => person.villaIds?.includes(input.villaId));
	const stay = {
		id: stayId,
		villaId: input.villaId,
		checkIn: input.checkIn,
		checkOut: input.checkOut,
		guests: input.guests,
		guestName: input.guestName?.trim() || "Khách",
		origin: "EXTERNAL",
		originLabel: input.source,
		status: "SCHEDULED",
		assignedButlerId: butler?.id
	};
	const commitment = {
		id: commitmentId,
		villaId: input.villaId,
		start: input.checkIn,
		end: input.checkOut,
		kind: "CONFIRMED_ACCOMMODATION",
		status: "ACTIVE",
		basis: "EXTERNAL",
		stayId,
		externalId: external.id,
		source: input.source,
		reference: ref,
		createdBy: "HOST",
		createdAt: world.now
	};
	let conflicts = world.conflicts ?? [];
	let conflict;
	if (overlapping.length > 0) {
		conflict = {
			id: nid("cnf"),
			villaId: input.villaId,
			commitmentIds: [...overlapping.map((item) => item.id), commitmentId],
			status: "OPEN",
			createdAt: world.now
		};
		conflicts = [conflict, ...conflicts];
	}
	return {
		world: withAudit({
			...world,
			externalAccommodations: [external, ...world.externalAccommodations],
			stays: [stay, ...world.stays],
			commitments: [...world.commitments, commitment],
			conflicts
		}, input.actor, "RECORD_EXTERNAL", stay.id),
		stay,
		commitment,
		conflict
	};
}
function createBlock(world, input) {
	world = expireHolds(world);
	assertHost(input.actor);
	requireVilla(input.villaId);
	if (nightsBetween$1(input.start, input.end) < 1) throw new DomainError("INVALID", "End must be after start");
	if (!isAvailable(world, input.villaId, input.start, input.end)) throw new DomainError("NOT_AVAILABLE", "Not available for these dates");
	const commitment = {
		id: nid("blk"),
		villaId: input.villaId,
		start: input.start,
		end: input.end,
		kind: "AVAILABILITY_BLOCK",
		status: "ACTIVE",
		basis: "BLOCK",
		blockKind: input.blockKind,
		note: input.note?.trim() || void 0,
		createdBy: "HOST",
		createdAt: world.now
	};
	return {
		world: withAudit({
			...world,
			commitments: [...world.commitments, commitment]
		}, input.actor, "CREATE_BLOCK", commitment.id),
		commitment
	};
}
function releaseBlock(world, input) {
	world = expireHolds(world);
	assertHost(input.actor);
	const current = requireCommitment(world, input.commitmentId);
	if (current.kind !== "AVAILABILITY_BLOCK") throw new DomainError("INVALID_TRANSITION", "Only an availability block can be released");
	if (current.status !== "ACTIVE") throw new DomainError("INVALID_TRANSITION", "Block is already ended");
	const commitment = {
		...current,
		status: "ENDED",
		endedReason: "RELEASED"
	};
	return {
		world: withAudit({
			...world,
			commitments: world.commitments.map((item) => item.id === commitment.id ? commitment : item)
		}, input.actor, "RELEASE_BLOCK", commitment.id),
		commitment
	};
}
function resolveConflict(world, input) {
	world = expireHolds(world);
	assertAdmin(input.actor);
	if (!input.reason.trim()) throw new DomainError("MISSING_REASON", "A reason is required");
	const current = (world.conflicts ?? []).find((item) => item.id === input.conflictId);
	if (!current) throw new DomainError("NOT_FOUND", "Conflict not found");
	if (current.status !== "OPEN") throw new DomainError("INVALID_TRANSITION", "Conflict is already resolved");
	if (input.keepCommitmentId === input.endCommitmentId) throw new DomainError("INVALID", "Keep and end must be different commitments");
	if (!current.commitmentIds.includes(input.keepCommitmentId) || !current.commitmentIds.includes(input.endCommitmentId)) throw new DomainError("INVALID", "Commitments must belong to the conflict");
	const ending = requireCommitment(world, input.endCommitmentId);
	if (ending.status !== "ACTIVE") throw new DomainError("INVALID_TRANSITION", "Commitment is already ended");
	if (stayForCommitment(world, ending)?.status === "CHECKED_IN") throw new DomainError("STAY_IN_PROGRESS", "Cannot end a commitment while the stay is in progress");
	const remaining = current.commitmentIds.filter((id) => id !== ending.id).map((id) => world.commitments.find((item) => item.id === id)).filter((item) => {
		if (!item || item.status !== "ACTIVE") return false;
		if (item.kind === "HOLD" && !isHoldActive(item, world.now)) return false;
		return true;
	});
	for (let i = 0; i < remaining.length; i += 1) for (let j = i + 1; j < remaining.length; j += 1) if (rangesOverlap(remaining[i].start, remaining[i].end, remaining[j].start, remaining[j].end)) throw new DomainError("STILL_OVERLAPPING", "Ending this commitment still leaves an overlap");
	const ended = {
		...ending,
		status: "ENDED",
		endedReason: "RELEASED"
	};
	let bookings = world.bookings;
	let stays = world.stays;
	let commissions = world.commissions;
	let requests = world.requests;
	let refund;
	if (ending.kind === "CONFIRMED_ACCOMMODATION" && ending.basis === "STAYORA_BOOKING" && ending.bookingId) {
		const booking = world.bookings.find((item) => item.id === ending.bookingId);
		if (booking && booking.status === "CONFIRMED") {
			const paid = world.obligations.filter((item) => item.requestId === booking.requestId).reduce((sum, obligation) => {
				return obligationSucceeded(world, obligation.id) ? sum + obligation.amount : sum;
			}, 0);
			const succeededAttempt = world.attempts.find((item) => item.status === "SUCCEEDED" && world.obligations.some((obligation) => obligation.id === item.obligationId && obligation.requestId === booking.requestId));
			const refunded = makeRefund(world, {
				requestId: booking.requestId,
				attemptId: succeededAttempt?.id,
				amount: paid || booking.total,
				reason: "CONFLICT_RESOLUTION"
			});
			world = refunded.world;
			refund = refunded.refund;
			bookings = world.bookings.map((item) => item.id === booking.id ? {
				...item,
				status: "CANCELLED",
				cancelledAt: world.now
			} : item);
			stays = world.stays.map((item) => item.id === booking.stayId && item.status === "SCHEDULED" ? {
				...item,
				status: "CANCELLED"
			} : item);
			commissions = world.commissions.map((item) => item.bookingId === booking.id ? {
				...item,
				status: "VOID"
			} : item);
		}
	}
	if (ending.kind === "CONFIRMED_ACCOMMODATION" && ending.basis === "EXTERNAL") {
		const stayId = ending.stayId;
		stays = stays.map((item) => item.id === stayId && item.status === "SCHEDULED" ? {
			...item,
			status: "CANCELLED"
		} : item);
	}
	if (ending.kind === "HOLD" && ending.requestId) requests = requests.map((item) => item.id === ending.requestId && item.status === "ACCEPTED" ? {
		...item,
		status: "CONFLICTED",
		conflictedAt: world.now
	} : item);
	const conflict = {
		...current,
		status: "RESOLVED",
		resolvedAt: world.now,
		keepCommitmentId: input.keepCommitmentId,
		endCommitmentId: input.endCommitmentId,
		reason: input.reason.trim()
	};
	return {
		world: withAudit({
			...world,
			bookings,
			stays,
			commissions,
			requests,
			commitments: world.commitments.map((item) => item.id === ended.id ? ended : item),
			conflicts: (world.conflicts ?? []).map((item) => item.id === conflict.id ? conflict : item)
		}, input.actor, "RESOLVE_CONFLICT", conflict.id, input.reason.trim()),
		conflict,
		refund
	};
}
function stayForCommitment(world, commitment) {
	if (commitment.stayId) return world.stays.find((item) => item.id === commitment.stayId);
	if (commitment.bookingId) return world.stays.find((item) => item.bookingId === commitment.bookingId);
}
function markRefundDone(world, input) {
	world = expireHolds(world);
	assertAdmin(input.actor);
	if (!input.note.trim()) throw new DomainError("MISSING_REASON", "A note is required");
	const current = (world.refundCases ?? []).find((item) => item.id === input.refundId);
	if (!current) throw new DomainError("NOT_FOUND", "Refund case not found");
	if (current.status !== "OPEN") throw new DomainError("INVALID_TRANSITION", "Refund is already done");
	const refund = {
		...current,
		status: "DONE",
		note: input.note.trim(),
		resolvedAt: world.now
	};
	return {
		world: withAudit({
			...world,
			refundCases: world.refundCases.map((item) => item.id === refund.id ? refund : item)
		}, input.actor, "MARK_REFUND_DONE", refund.id, input.note.trim()),
		refund
	};
}
function stayGuestLabel(status) {
	switch (status) {
		case "SCHEDULED": return "Sắp đến";
		case "CHECKED_IN": return "Đang lưu trú";
		case "CHECKED_OUT": return "Đã trả phòng";
		case "COMPLETED": return "Hoàn tất";
		case "DID_NOT_OCCUR": return "Không diễn ra";
		case "CANCELLED": return "Đã huỷ";
	}
}
function opsLists(world, date) {
	const live = world.stays.filter((stay) => stay.status !== "CANCELLED");
	const arriving = live.filter((stay) => stay.checkIn === date);
	const departing = live.filter((stay) => stay.checkOut === date && stay.status !== "DID_NOT_OCCUR" && stay.status !== "SCHEDULED");
	return {
		arriving,
		inHouse: live.filter((stay) => stay.status === "CHECKED_IN" && stay.checkIn < date && date < stay.checkOut),
		departing
	};
}
function obligationSucceeded(world, obligationId) {
	return world.attempts.some((attempt) => attempt.obligationId === obligationId && attempt.status === "SUCCEEDED");
}
function hostToday(world, date) {
	const pending = world.requests.filter((item) => item.status === "PENDING");
	const lists = opsLists(world, date);
	const openConflicts = (world.conflicts ?? []).filter((item) => item.status === "OPEN");
	const nowMs = parseISO(world.now).getTime();
	const horizon = nowMs + 1728e5;
	const balancesDue = world.obligations.filter((obligation) => {
		if (obligation.kind !== "BALANCE") return false;
		if (obligationSucceeded(world, obligation.id)) return false;
		if (!world.bookings.find((item) => item.requestId === obligation.requestId && item.status === "CONFIRMED")) return false;
		const due = parseISO(obligation.dueAt).getTime();
		return due >= nowMs && due <= horizon;
	});
	return {
		pending,
		arriving: lists.arriving,
		departing: lists.departing,
		openConflicts,
		balancesDue
	};
}
var NIGHTLY = {
	"sao-bien": 165e5,
	"huong-tram": 94e5,
	"minh-dam": 224e5,
	"gio-bien": 108e5,
	"cat-vang": 182e5,
	"sen-hong": 62e5
};
var OWNER_BLOCKS = [
	{
		villaId: "sao-bien",
		start: "2026-10-23",
		end: "2026-10-27"
	},
	{
		villaId: "huong-tram",
		start: "2026-11-12",
		end: "2026-11-16"
	},
	{
		villaId: "minh-dam",
		start: "2026-10-15",
		end: "2026-10-21"
	},
	{
		villaId: "sen-hong",
		start: "2026-11-01",
		end: "2026-11-05"
	},
	{
		villaId: "gio-bien",
		start: "2026-10-30",
		end: "2026-11-03"
	},
	{
		villaId: "cat-vang",
		start: "2026-09-28",
		end: "2026-10-03"
	}
];
function stayoraBundle(input) {
	const nights = nightsBetween$1(input.checkIn, input.checkOut);
	const nightly = NIGHTLY[input.villaId] ?? 0;
	const total = nightly * nights;
	return {
		booking: {
			id: input.bookingId,
			requestId: input.requestId,
			stayId: input.stayId,
			villaId: input.villaId,
			reference: input.reference,
			checkIn: input.checkIn,
			checkOut: input.checkOut,
			guests: input.guests,
			guestName: input.guestName,
			nightly,
			nights,
			total,
			saleId: input.saleId,
			status: "CONFIRMED",
			confirmedAt: input.now
		},
		stay: {
			id: input.stayId,
			bookingId: input.bookingId,
			requestId: input.requestId,
			villaId: input.villaId,
			checkIn: input.checkIn,
			checkOut: input.checkOut,
			guests: input.guests,
			guestName: input.guestName,
			origin: "STAYORA",
			originLabel: "Stayora",
			status: input.stayStatus,
			assignedButlerId: input.assignedButlerId,
			checkedInAt: input.checkedInAt,
			checkedOutAt: input.checkedOutAt,
			completedAt: input.completedAt
		},
		commitment: {
			id: input.commitmentId,
			villaId: input.villaId,
			start: input.checkIn,
			end: input.checkOut,
			kind: "CONFIRMED_ACCOMMODATION",
			status: "ACTIVE",
			basis: "STAYORA_BOOKING",
			requestId: input.requestId,
			bookingId: input.bookingId,
			stayId: input.stayId,
			reference: input.reference,
			createdBy: "HOST",
			createdAt: input.now
		},
		commission: input.saleId ? {
			id: `com_${input.bookingId}`,
			bookingId: input.bookingId,
			stayId: input.stayId,
			saleId: input.saleId,
			amount: Math.round(total * .1),
			status: input.stayStatus === "COMPLETED" ? "EARNED" : "PENDING"
		} : void 0,
		request: input.includeRequest ? {
			id: input.requestId,
			villaId: input.villaId,
			checkIn: input.checkIn,
			checkOut: input.checkOut,
			guests: input.guests,
			guestName: input.guestName,
			nightly,
			nights,
			total,
			source: input.saleId ? "SALE" : "GUEST",
			saleId: input.saleId,
			status: "ACCEPTED",
			createdAt: input.now,
			acceptedAt: input.now
		} : void 0
	};
}
function pendingGuest(input) {
	const nights = nightsBetween$1(input.checkIn, input.checkOut);
	const nightly = NIGHTLY[input.villaId] ?? 0;
	return {
		id: input.id,
		villaId: input.villaId,
		checkIn: input.checkIn,
		checkOut: input.checkOut,
		guests: input.guests,
		guestName: input.guestName,
		nightly,
		nights,
		total: nightly * nights,
		source: "GUEST",
		status: "PENDING",
		createdAt: input.now
	};
}
function seedWorld(now = PILOT_NOW) {
	const world = createEmptyWorld(now);
	const bundles = [
		stayoraBundle({
			now,
			requestId: "req_seed_depart",
			bookingId: "bkg_seed_depart",
			stayId: "sty_seed_depart",
			commitmentId: "cmt_seed_depart",
			villaId: "sao-bien",
			checkIn: "2026-09-19",
			checkOut: "2026-09-22",
			guests: 6,
			guestName: "Mai Phương",
			stayStatus: "CHECKED_IN",
			assignedButlerId: BUTLER_LINH,
			checkedInAt: "2026-09-19T06:00:00.000Z",
			reference: "STY-8M2P"
		}),
		stayoraBundle({
			now,
			requestId: "req_seed_arrive",
			bookingId: "bkg_seed_arrive",
			stayId: "sty_seed_arrive",
			commitmentId: "cmt_seed_arrive",
			villaId: "gio-bien",
			checkIn: "2026-09-22",
			checkOut: "2026-09-25",
			guests: 5,
			guestName: "Lê Minh",
			stayStatus: "SCHEDULED",
			assignedButlerId: BUTLER_LINH,
			reference: "STY-4K9Q"
		}),
		stayoraBundle({
			now,
			requestId: "req_seed_hill",
			bookingId: "bkg_seed_hill",
			stayId: "sty_seed_hill",
			commitmentId: "cmt_seed_hill",
			villaId: "minh-dam",
			checkIn: "2026-09-22",
			checkOut: "2026-09-26",
			guests: 8,
			guestName: "Ngô Hà",
			stayStatus: "SCHEDULED",
			reference: "STY-2N7R"
		}),
		stayoraBundle({
			now,
			requestId: "req_seed_sale_future",
			bookingId: "bkg_seed_sale_future",
			stayId: "sty_seed_sale_future",
			commitmentId: "cmt_seed_sale_future",
			villaId: "cat-vang",
			checkIn: "2026-10-16",
			checkOut: "2026-10-19",
			guests: 8,
			guestName: "Phạm Gia",
			saleId: SALE_MAI,
			stayStatus: "SCHEDULED",
			assignedButlerId: BUTLER_LINH,
			reference: "STY-9C3L",
			includeRequest: true
		}),
		stayoraBundle({
			now,
			requestId: "req_seed_sale_done",
			bookingId: "bkg_seed_sale_done",
			stayId: "sty_seed_sale_done",
			commitmentId: "cmt_seed_sale_done",
			villaId: "sen-hong",
			checkIn: "2026-08-01",
			checkOut: "2026-08-04",
			guests: 2,
			guestName: "Trang & Olivier",
			saleId: SALE_MAI,
			stayStatus: "COMPLETED",
			checkedInAt: "2026-08-01T06:00:00.000Z",
			checkedOutAt: "2026-08-04T04:00:00.000Z",
			completedAt: "2026-08-04T04:05:00.000Z",
			reference: "STY-1H5W",
			includeRequest: true
		})
	];
	const external = {
		id: "ext_seed_huong",
		villaId: "huong-tram",
		checkIn: "2026-09-20",
		checkOut: "2026-09-24",
		guests: 4,
		source: "Khách quen"
	};
	const externalStay = {
		id: "sty_seed_ext",
		villaId: "huong-tram",
		checkIn: "2026-09-20",
		checkOut: "2026-09-24",
		guests: 4,
		guestName: "Gia đình Trần",
		origin: "EXTERNAL",
		originLabel: "Khách quen",
		status: "CHECKED_IN",
		checkedInAt: "2026-09-20T07:00:00.000Z"
	};
	const externalCommitment = {
		id: "cmt_seed_ext",
		villaId: "huong-tram",
		start: "2026-09-20",
		end: "2026-09-24",
		kind: "CONFIRMED_ACCOMMODATION",
		status: "ACTIVE",
		basis: "EXTERNAL",
		stayId: "sty_seed_ext",
		externalId: "ext_seed_huong",
		source: "Khách quen",
		createdBy: "HOST",
		createdAt: now
	};
	const blocks = OWNER_BLOCKS.map((block, index) => ({
		id: `blk_seed_${index + 1}`,
		villaId: block.villaId,
		start: block.start,
		end: block.end,
		kind: "AVAILABILITY_BLOCK",
		status: "ACTIVE",
		basis: "BLOCK",
		blockKind: "OWNER",
		createdBy: "HOST",
		createdAt: now
	}));
	const pending = [pendingGuest({
		now,
		id: "req_seed_guest_pending",
		villaId: "sen-hong",
		checkIn: "2026-10-16",
		checkOut: "2026-10-19",
		guests: 2,
		guestName: "Nguyễn An"
	}), pendingGuest({
		now,
		id: "req_seed_guest_pending_2",
		villaId: "huong-tram",
		checkIn: "2026-10-10",
		checkOut: "2026-10-13",
		guests: 4,
		guestName: "Lê Hoa"
	})];
	return {
		...world,
		requests: [...pending, ...bundles.flatMap((item) => item.request ? [item.request] : [])],
		bookings: bundles.map((item) => item.booking),
		stays: [...bundles.map((item) => item.stay), externalStay],
		commitments: [
			...bundles.map((item) => item.commitment),
			externalCommitment,
			...blocks
		],
		commissions: bundles.flatMap((item) => item.commission ? [item.commission] : []),
		externalAccommodations: [external]
	};
}
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
function withWorldDefaults(world) {
	return {
		...world,
		refundCases: world.refundCases ?? [],
		conflicts: world.conflicts ?? [],
		auditLog: world.auditLog ?? []
	};
}
var useBookingStore = create()(persist((set, get) => ({
	hydrated: false,
	persona: "GUEST",
	world: seedWorld(),
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
	setSearch: (search) => set((state) => ({ search: {
		...state.search,
		...search
	} })),
	setSaleSearch: (search) => set((state) => ({ saleSearch: {
		...state.saleSearch,
		...search
	} })),
	setOpsDate: (opsDate) => set({ opsDate }),
	tickExpiry: () => {
		const next = expireHolds(withWorldDefaults(get().world));
		if (next !== get().world) set({ world: next });
	},
	advanceDemo: () => {
		set({ world: advanceTime(withWorldDefaults(get().world), HOLD_MS) });
	},
	guestCreateRequest: (input) => {
		const result = createRequest(withWorldDefaults(get().world), {
			...input,
			guestName: "Khách",
			actor: { persona: "GUEST" }
		});
		set({ world: result.world });
		return { requestId: result.request.id };
	},
	saleCreateRequest: (input) => {
		const result = createRequest(withWorldDefaults(get().world), {
			...input,
			actor: {
				persona: "SALE",
				saleId: SALE_MAI
			}
		});
		set({ world: result.world });
		return { requestId: result.request.id };
	},
	hostAccept: (requestId) => {
		set({ world: acceptRequest(withWorldDefaults(get().world), {
			requestId,
			actor: { persona: "HOST" }
		}).world });
	},
	hostExternal: (input) => {
		set({ world: recordExternalBooking(withWorldDefaults(get().world), {
			...input,
			actor: { persona: "HOST" }
		}).world });
	},
	hostCreateBlock: (input) => {
		set({ world: createBlock(withWorldDefaults(get().world), {
			...input,
			actor: { persona: "HOST" }
		}).world });
	},
	hostReleaseBlock: (commitmentId) => {
		set({ world: releaseBlock(withWorldDefaults(get().world), {
			commitmentId,
			actor: { persona: "HOST" }
		}).world });
	},
	adminRecordPayment: (obligationId, outcome) => {
		set({ world: recordPayment(withWorldDefaults(get().world), {
			obligationId,
			outcome,
			actor: { persona: "ADMIN" }
		}).world });
	},
	adminResolveUnknown: (attemptId, outcome) => {
		set({ world: resolveUnknown(withWorldDefaults(get().world), {
			attemptId,
			outcome,
			actor: { persona: "ADMIN" }
		}).world });
	},
	adminMarkRefundDone: (refundId, note) => {
		set({ world: markRefundDone(withWorldDefaults(get().world), {
			refundId,
			note,
			actor: { persona: "ADMIN" }
		}).world });
	},
	adminResolveConflict: (input) => {
		set({ world: resolveConflict(withWorldDefaults(get().world), {
			...input,
			actor: { persona: "ADMIN" }
		}).world });
	},
	butlerCheckIn: (stayId) => {
		set({ world: checkInStay(withWorldDefaults(get().world), {
			stayId,
			actor: {
				persona: "BUTLER",
				butlerId: BUTLER_LINH
			}
		}).world });
	},
	butlerCheckOut: (stayId) => {
		set({ world: checkOutStay(withWorldDefaults(get().world), {
			stayId,
			actor: {
				persona: "BUTLER",
				butlerId: BUTLER_LINH
			}
		}).world });
	},
	butlerNoShow: (stayId, reason) => {
		set({ world: markDidNotOccur(withWorldDefaults(get().world), {
			stayId,
			actor: {
				persona: "BUTLER",
				butlerId: BUTLER_LINH
			},
			reason
		}).world });
	},
	butlerIncident: (stayId, note, hasPhoto) => {
		set({ world: reportIncident(withWorldDefaults(get().world), {
			stayId,
			actor: {
				persona: "BUTLER",
				butlerId: BUTLER_LINH
			},
			note,
			hasPhoto
		}).world });
	}
}), {
	name: "stayora-phase2",
	storage: createJSONStorage(() => localStorage),
	skipHydration: true,
	partialize: (state) => ({
		persona: state.persona,
		world: state.world,
		search: state.search,
		saleSearch: state.saleSearch,
		opsDate: state.opsDate
	}),
	onRehydrateStorage: () => (state) => {
		if (state) {
			state.world = expireHolds(withWorldDefaults(state.world));
			state.setHydrated(true);
		}
	}
}));
//#endregion
export { obligationSucceeded as C, stayGuestLabel as D, paymentPlanLabel as E, useBookingStore as O, nightsBetween as S, parseStaySearch as T, guestLabel as _, DomainError as a, isIsoDate as b, bedroomLabel as c, cn as d, commitmentsOnDate as f, getVilla as g, formatVnd as h, DESTINATION as i, villas as k, bookability as l, formatDateRange as m, BUTLER_LINH as n, SALE_MAI as o, disabledMatchers as p, Button as r, TIMEZONE as s, AMENITY_LABELS as t, bookabilityCopy as u, hostToday as v, opsLists as w, nightLabel as x, isAvailable as y };

import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { A as differenceInCalendarDays, F as addDays, c as isAfter, d as format, i as parseISO, j as startOfDay } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-DTEBiuLL.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var DomainError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "DomainError";
		this.code = code;
	}
};
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
		rating: 4.94,
		reviewCount: 28,
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
				alt: "Infinity pool of Villa Sao Biển looking out to the East Sea"
			},
			{
				src: "/images/villas/sao-bien-living.jpg",
				alt: "Open living room with linen sofas facing the pool and ocean"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "King bedroom with white linen and a garden window"
			},
			{
				src: "/images/beach-club.jpg",
				alt: "Oceanami beach club along Phước Hải beach"
			}
		],
		blocked: [{
			start: "2026-10-23",
			end: "2026-10-27"
		}],
		reviews: [{
			name: "Mai",
			when: "August 2026",
			text: "The pool really does meet the sea. We cooked one night and ate at the beach club the next. Easy with two children."
		}, {
			name: "James",
			when: "May 2026",
			text: "Quiet in the mornings, staff nearby without hovering. The house is the stay — we barely left the deck."
		}]
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
		rating: 4.9,
		reviewCount: 41,
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
				alt: "Garden pool of Villa Hương Tràm framed by tropical plants"
			},
			{
				src: "/images/villas/huong-tram-living.jpg",
				alt: "Dining room with rattan and teak looking onto the garden"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Quiet bedroom with garden light"
			},
			{
				src: "/images/spa.jpg",
				alt: "Oceanami spa treatment room"
			}
		],
		blocked: [{
			start: "2026-11-12",
			end: "2026-11-16"
		}],
		reviews: [{
			name: "Linh",
			when: "July 2026",
			text: "We could hear the sea and still felt hidden. The garden is the whole character of the house."
		}, {
			name: "Anh",
			when: "March 2026",
			text: "Beautifully kept, and the walk to the beach club is short. Would return for a long weekend."
		}]
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
		rating: 4.97,
		reviewCount: 19,
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
				alt: "Hillside Villa Minh Đạm at dusk overlooking sea and mountain"
			},
			{
				src: "/images/villas/minh-dam-terrace.jpg",
				alt: "Terrace dining table looking toward the East Sea"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "King bedroom with garden and sea light"
			},
			{
				src: "/images/oceanami-hero.jpg",
				alt: "Oceanami villas between Phước Hải beach and Minh Đạm mountain"
			}
		],
		blocked: [{
			start: "2026-10-15",
			end: "2026-10-21"
		}],
		reviews: [{
			name: "Hạnh",
			when: "April 2026",
			text: "We were twelve at dinner on the terrace and it still felt considered. The view does half the hosting."
		}, {
			name: "Daniel",
			when: "January 2026",
			text: "A proper family house. High enough to be quiet, close enough to walk down for a swim."
		}]
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
		rating: 4.88,
		reviewCount: 36,
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
				alt: "Courtyard of Villa Sen Hồng with a still lotus pond"
			},
			{
				src: "/images/villas/sen-hong-courtyard.jpg",
				alt: "Lotus pond and daybed in the Sen Hồng courtyard"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Calm bedroom with white linen"
			},
			{
				src: "/images/spa.jpg",
				alt: "Quiet spa room at Oceanami"
			}
		],
		blocked: [{
			start: "2026-11-01",
			end: "2026-11-05"
		}],
		reviews: [{
			name: "Trang",
			when: "June 2026",
			text: "We wanted somewhere small. The courtyard is the whole stay — we read, we swam, we didn't perform a holiday."
		}, {
			name: "Olivier",
			when: "February 2026",
			text: "Tactile and quiet. Not a show villa, which is exactly why we booked it."
		}]
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
		rating: 4.91,
		reviewCount: 33,
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
				alt: "Family pool and lawn at Villa Gió Biển"
			},
			{
				src: "/images/villas/gio-bien-living.jpg",
				alt: "Open kitchen and dining table looking onto the pool"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Bedroom with garden light"
			},
			{
				src: "/images/beach-club.jpg",
				alt: "Beach club a short walk from the villa"
			}
		],
		blocked: [{
			start: "2026-10-30",
			end: "2026-11-03"
		}],
		reviews: [{
			name: "Hương",
			when: "August 2026",
			text: "The kitchen saved us. We had three children and never felt packed. Pool shelf is a gift."
		}, {
			name: "Tom",
			when: "May 2026",
			text: "Family stay without the resort-room feeling. We walked to the beach club every afternoon."
		}]
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
		rating: 4.93,
		reviewCount: 22,
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
				alt: "Pavilion living and pool at Villa Cát Vàng beside the beach"
			},
			{
				src: "/images/villas/cat-vang-pool.jpg",
				alt: "Private pool with Phước Hải beach just beyond"
			},
			{
				src: "/images/villas/sao-bien-living.jpg",
				alt: "Open living looking toward water"
			},
			{
				src: "/images/villas/bedroom.jpg",
				alt: "Bedroom with white linen and garden light"
			}
		],
		blocked: [{
			start: "2026-09-28",
			end: "2026-10-03"
		}],
		reviews: [{
			name: "Ngọc",
			when: "July 2026",
			text: "We were in the sea before breakfast. The outdoor kitchen is the heart of the house."
		}, {
			name: "Elena",
			when: "April 2026",
			text: "As close to the beach as I would want with children. Beautiful at golden hour."
		}]
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
var HOLD_MS = 864e5;
var COMMISSION_RATE = .1;
var PILOT_NOW = "2026-09-22T03:00:00.000Z";
var PAYMENT_RULE = {
	"sao-bien": "FIFTY_FIFTY",
	"huong-tram": "FULL",
	"minh-dam": "FIFTY_FIFTY",
	"sen-hong": "FULL",
	"gio-bien": "FIFTY_FIFTY",
	"cat-vang": "FIFTY_FIFTY"
};
function paymentRuleOf(villaId) {
	return PAYMENT_RULE[villaId] ?? "FULL";
}
function paymentRuleLabel(rule) {
	return rule === "FIFTY_FIFTY" ? "50/50" : "100%";
}
function requireVilla(villaId) {
	const villa = getVilla(villaId);
	if (!villa) throw new Error(`Unknown villa ${villaId}`);
	return villa;
}
function nightsBetween$3(checkIn, checkOut) {
	return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}
function rangesOverlap$1(start, end, otherStart, otherEnd) {
	return start < otherEnd && end > otherStart;
}
function activeCommitments(world) {
	const expiredHolds = new Set(world.requests.filter((request) => request.status === "EXPIRED" || request.status === "ACCEPTED" && request.holdExpiresAt && request.holdExpiresAt <= world.now).map((request) => request.id));
	return world.commitments.filter((commitment) => {
		if (commitment.kind === "CONFIRMED_ACCOMMODATION") return true;
		if (commitment.kind === "HOLD") {
			if (!commitment.requestId) return true;
			if (expiredHolds.has(commitment.requestId)) return false;
			const request = world.requests.find((item) => item.id === commitment.requestId);
			if (!request) return false;
			if (request.status !== "ACCEPTED") return false;
			if (request.holdExpiresAt && request.holdExpiresAt <= world.now) return false;
			return true;
		}
		return false;
	});
}
function isAvailable(world, villaId, checkIn, checkOut) {
	if (nightsBetween$3(checkIn, checkOut) < 1) return false;
	const villa = getVilla(villaId);
	if (!villa) return false;
	if (villa.blocked.some((block) => rangesOverlap$1(checkIn, checkOut, block.start, block.end))) return false;
	return !activeCommitments(world).some((commitment) => commitment.villaId === villaId && rangesOverlap$1(checkIn, checkOut, commitment.start, commitment.end));
}
function occupiedRanges(world, villaId) {
	const blocked = getVilla(villaId)?.blocked.map((block) => ({
		start: block.start,
		end: block.end
	})) ?? [];
	const committed = activeCommitments(world).filter((commitment) => commitment.villaId === villaId).map((commitment) => ({
		start: commitment.start,
		end: commitment.end
	}));
	return [...blocked, ...committed];
}
function nid(prefix) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
function nightsBetween$2(checkIn, checkOut) {
	return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}
function reference() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let token = "";
	for (let i = 0; i < 4; i += 1) token += alphabet[Math.floor(Math.random() * 32)];
	return `STY-${token}`;
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
function assertHost(actor) {
	if (actor.persona !== "HOST") throw new DomainError("FORBIDDEN", "Only Host can accept or confirm a request");
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
function createEmptyWorld(now) {
	return {
		now,
		requests: [],
		bookings: [],
		stays: [],
		commitments: [],
		incidents: [],
		commissions: [],
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
	if (input.actor.persona !== "GUEST" && input.actor.persona !== "SALE") throw new DomainError("FORBIDDEN", "Only Guest or Sale can create a request");
	const villa = requireVilla(input.villaId);
	const nights = nightsBetween$2(input.checkIn, input.checkOut);
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
		paymentRule: paymentRuleOf(input.villaId),
		source,
		saleId,
		status: "PENDING",
		createdAt: world.now
	};
	return {
		world: {
			...world,
			requests: [request, ...world.requests]
		},
		request
	};
}
function acceptRequest(world, input) {
	assertHost(input.actor);
	const current = requireRequest(world, input.requestId);
	if (current.status !== "PENDING") throw new DomainError("INVALID_TRANSITION", "Only a pending request can be accepted");
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
		requestId: request.id
	};
	return {
		world: {
			...replaceRequest(world, request),
			commitments: [...world.commitments, hold]
		},
		request
	};
}
function confirmRequest(world, input) {
	assertHost(input.actor);
	const current = requireRequest(world, input.requestId);
	if (current.status !== "ACCEPTED") throw new DomainError("INVALID_TRANSITION", "Only an accepted request can be confirmed");
	const bookingId = nid("bkg");
	const stayId = nid("sty");
	const ref = reference();
	const request = {
		...current,
		status: "CONFIRMED",
		confirmedAt: world.now,
		reference: ref,
		bookingId,
		stayId
	};
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
		paymentRule: request.paymentRule,
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
	const commitment = {
		id: nid("cmt"),
		villaId: request.villaId,
		start: request.checkIn,
		end: request.checkOut,
		kind: "CONFIRMED_ACCOMMODATION",
		requestId: request.id,
		bookingId
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
			...replaceRequest(world, request),
			bookings: [booking, ...world.bookings],
			stays: [stay, ...world.stays],
			commitments: [...world.commitments.filter((item) => !(item.kind === "HOLD" && item.requestId === request.id)), commitment],
			commissions
		},
		request,
		booking,
		stay
	};
}
function confirmGuestRequest(world, requestId) {
	const pending = requireRequest(world, requestId);
	let next = world;
	if (pending.status === "PENDING") next = acceptRequest(next, {
		requestId,
		actor: { persona: "HOST" }
	}).world;
	const accepted = requireRequest(next, requestId);
	if (accepted.status === "CONFIRMED") return {
		world: next,
		request: accepted,
		booking: next.bookings.find((item) => item.id === accepted.bookingId),
		stay: next.stays.find((item) => item.id === accepted.stayId)
	};
	return confirmRequest(next, {
		requestId,
		actor: { persona: "HOST" }
	});
}
function checkInStay(world, input) {
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	if (stay.status !== "SCHEDULED") throw new DomainError("INVALID_TRANSITION", "Check-in is only possible from scheduled");
	const updated = {
		...stay,
		status: "CHECKED_IN",
		checkedInAt: world.now
	};
	return {
		world: replaceStay(world, updated),
		stay: updated
	};
}
function checkOutStay(world, input) {
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	if (stay.status !== "CHECKED_IN") throw new DomainError("INVALID_TRANSITION", "Check-out is only possible after check-in");
	const completed = {
		...stay,
		status: "CHECKED_OUT",
		checkedOutAt: world.now,
		status: "COMPLETED",
		completedAt: world.now
	};
	const commissions = world.commissions.map((item) => item.stayId === stay.id ? {
		...item,
		status: "EARNED"
	} : item);
	return {
		world: {
			...replaceStay(world, completed),
			commissions
		},
		stay: completed
	};
}
function markDidNotOccur(world, input) {
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	if (stay.status === "CHECKED_IN") throw new DomainError("INVALID_TRANSITION", "DID_NOT_OCCUR is refused after check-in");
	if (stay.status !== "SCHEDULED") throw new DomainError("INVALID_TRANSITION", "No-show is only possible from scheduled");
	if (!input.reason.trim()) throw new DomainError("MISSING_REASON", "A reason is required");
	const updated = {
		...stay,
		status: "DID_NOT_OCCUR",
		didNotOccurReason: input.reason.trim(),
		didNotOccurAt: world.now
	};
	return {
		world: replaceStay(world, updated),
		stay: updated
	};
}
function reportIncident(world, input) {
	if (input.actor.persona !== "BUTLER") throw new DomainError("FORBIDDEN", "Only a Butler can report an incident");
	const stay = requireStay(world, input.stayId);
	assertButlerAssigned(world, input.actor, stay.villaId);
	return { world: {
		...world,
		incidents: [{
			id: nid("inc"),
			stayId: stay.id,
			villaId: stay.villaId,
			note: input.note.trim(),
			hasPhoto: input.hasPhoto,
			createdAt: world.now,
			createdBy: "BUTLER"
		}, ...world.incidents]
	} };
}
function stayGuestLabel(status) {
	switch (status) {
		case "SCHEDULED": return "Sắp đến";
		case "CHECKED_IN": return "Đang lưu trú";
		case "CHECKED_OUT": return "Đã trả phòng";
		case "COMPLETED": return "Hoàn tất";
		case "DID_NOT_OCCUR": return "Không diễn ra";
	}
}
function opsLists(world, date) {
	const arriving = world.stays.filter((stay) => stay.checkIn === date);
	const departing = world.stays.filter((stay) => stay.checkOut === date && stay.status !== "DID_NOT_OCCUR" && stay.status !== "SCHEDULED");
	return {
		arriving,
		inHouse: world.stays.filter((stay) => stay.status === "CHECKED_IN" && stay.checkIn < date && date < stay.checkOut),
		departing
	};
}
function nightsBetween$1(checkIn, checkOut) {
	return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}
function confirmedBundle(input) {
	const nights = nightsBetween$1(input.checkIn, input.checkOut);
	const nightly = {
		"sao-bien": 165e5,
		"huong-tram": 94e5,
		"minh-dam": 224e5,
		"gio-bien": 108e5,
		"cat-vang": 182e5,
		"sen-hong": 62e5
	}[input.villaId] ?? 0;
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
			paymentRule: paymentRuleOf(input.villaId),
			saleId: input.saleId,
			status: "CONFIRMED",
			confirmedAt: input.now
		},
		stay: {
			id: input.stayId,
			bookingId: input.origin === "STAYORA" ? input.bookingId : void 0,
			requestId: input.origin === "STAYORA" ? input.requestId : void 0,
			villaId: input.villaId,
			checkIn: input.checkIn,
			checkOut: input.checkOut,
			guests: input.guests,
			guestName: input.guestName,
			origin: input.origin,
			originLabel: input.originLabel,
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
			requestId: input.origin === "STAYORA" ? input.requestId : void 0,
			bookingId: input.origin === "STAYORA" ? input.bookingId : void 0
		},
		commission: input.saleId ? {
			id: `com_${input.bookingId}`,
			bookingId: input.bookingId,
			stayId: input.stayId,
			saleId: input.saleId,
			amount: Math.round(total * .1),
			status: input.stayStatus === "COMPLETED" ? "EARNED" : "PENDING"
		} : void 0,
		request: input.saleId ? {
			id: input.requestId,
			villaId: input.villaId,
			checkIn: input.checkIn,
			checkOut: input.checkOut,
			guests: input.guests,
			guestName: input.guestName,
			nightly,
			nights,
			total,
			paymentRule: paymentRuleOf(input.villaId),
			source: "SALE",
			saleId: input.saleId,
			status: "CONFIRMED",
			createdAt: input.now,
			acceptedAt: input.now,
			confirmedAt: input.now,
			reference: input.reference,
			bookingId: input.bookingId,
			stayId: input.stayId
		} : void 0
	};
}
function seedWorld(now = PILOT_NOW) {
	const world = createEmptyWorld(now);
	const bundles = [
		confirmedBundle({
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
			origin: "STAYORA",
			originLabel: "Stayora",
			assignedButlerId: BUTLER_LINH,
			checkedInAt: "2026-09-19T06:00:00.000Z",
			reference: "STY-8M2P"
		}),
		confirmedBundle({
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
			origin: "STAYORA",
			originLabel: "Stayora",
			assignedButlerId: BUTLER_LINH,
			reference: "STY-4K9Q"
		}),
		confirmedBundle({
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
			origin: "STAYORA",
			originLabel: "Stayora",
			reference: "STY-2N7R"
		}),
		confirmedBundle({
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
			origin: "STAYORA",
			originLabel: "Stayora",
			assignedButlerId: BUTLER_LINH,
			reference: "STY-9C3L"
		}),
		confirmedBundle({
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
			origin: "STAYORA",
			originLabel: "Stayora",
			assignedButlerId: void 0,
			checkedInAt: "2026-08-01T06:00:00.000Z",
			checkedOutAt: "2026-08-04T04:00:00.000Z",
			completedAt: "2026-08-04T04:05:00.000Z",
			reference: "STY-1H5W"
		}),
		confirmedBundle({
			now,
			requestId: "req_seed_ext",
			bookingId: "bkg_seed_ext",
			stayId: "sty_seed_ext",
			commitmentId: "cmt_seed_ext",
			villaId: "huong-tram",
			checkIn: "2026-09-20",
			checkOut: "2026-09-24",
			guests: 4,
			guestName: "Gia đình Trần",
			stayStatus: "CHECKED_IN",
			origin: "EXTERNAL",
			originLabel: "Oceanami trực tiếp",
			checkedInAt: "2026-09-20T07:00:00.000Z",
			reference: "EXT-2209"
		})
	];
	return {
		...world,
		requests: bundles.flatMap((item) => item.request ? [item.request] : []),
		bookings: bundles.map((item) => item.booking),
		stays: bundles.map((item) => item.stay),
		commitments: bundles.map((item) => item.commitment),
		commissions: bundles.flatMap((item) => item.commission ? [item.commission] : [])
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
function formatLongDate(iso) {
	return format(parseISO(iso), "EEEE d MMMM yyyy");
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
function rangesOverlap(start, end, blockedStart, blockedEnd) {
	return start < blockedEnd && end > blockedStart;
}
function isRangeAvailable(villa, checkIn, checkOut, world) {
	if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return false;
	if (nightsBetween(checkIn, checkOut) < 1) return false;
	if (world) return isAvailable(world, villa.id, checkIn, checkOut);
	return !villa.blocked.some((block) => rangesOverlap(checkIn, checkOut, block.start, block.end));
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
	if (!villa) return matchers;
	const ranges = world ? occupiedRanges(world, villa.id) : villa.blocked;
	for (const block of ranges) {
		const from = parseISO(block.start);
		const to = addDays(parseISO(block.end), -1);
		if (isAfter(to, addDays(from, -1))) matchers.push({
			from,
			to
		});
	}
	return matchers;
}
function withNow(world) {
	return {
		...world,
		now: (/* @__PURE__ */ new Date()).toISOString()
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
	guestCreateRequest: (input) => {
		const result = createRequest(withNow(get().world), {
			...input,
			guestName: "Khách",
			actor: { persona: "GUEST" }
		});
		set({ world: result.world });
		return { requestId: result.request.id };
	},
	saleCreateRequest: (input) => {
		const result = createRequest(withNow(get().world), {
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
		set({ world: acceptRequest(withNow(get().world), {
			requestId,
			actor: { persona: "HOST" }
		}).world });
	},
	hostConfirm: (requestId) => {
		set({ world: confirmRequest(withNow(get().world), {
			requestId,
			actor: { persona: "HOST" }
		}).world });
	},
	confirmRequest: (requestId) => {
		set({ world: confirmGuestRequest(withNow(get().world), requestId).world });
	},
	butlerCheckIn: (stayId) => {
		set({ world: checkInStay(withNow(get().world), {
			stayId,
			actor: {
				persona: "BUTLER",
				butlerId: BUTLER_LINH
			}
		}).world });
	},
	butlerCheckOut: (stayId) => {
		set({ world: checkOutStay(withNow(get().world), {
			stayId,
			actor: {
				persona: "BUTLER",
				butlerId: BUTLER_LINH
			}
		}).world });
	},
	butlerNoShow: (stayId, reason) => {
		set({ world: markDidNotOccur(withNow(get().world), {
			stayId,
			actor: {
				persona: "BUTLER",
				butlerId: BUTLER_LINH
			},
			reason
		}).world });
	},
	butlerIncident: (stayId, note, hasPhoto) => {
		set({ world: reportIncident(withNow(get().world), {
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
	name: "stayora-phase3",
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
		state?.setHydrated(true);
	}
}));
//#endregion
export { paymentRuleOf as C, villas as E, paymentRuleLabel as S, useBookingStore as T, isIsoDate as _, SALE_MAI as a, opsLists as b, bookabilityCopy as c, formatDateRange as d, formatLongDate as f, isAvailable as g, guestLabel as h, DomainError as i, cn as l, getVilla as m, BUTLER_LINH as n, bedroomLabel as o, formatVnd as p, DESTINATION as r, bookability as s, AMENITY_LABELS as t, disabledMatchers as u, nightLabel as v, stayGuestLabel as w, parseStaySearch as x, nightsBetween as y };

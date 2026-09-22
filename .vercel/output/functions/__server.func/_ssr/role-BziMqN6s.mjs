//#region node_modules/.nitro/vite/services/ssr/assets/role-BziMqN6s.js
var pilot_seed_default = {
	hosts: [{
		"id": "host-a",
		"name": "Chủ nhà A"
	}, {
		"id": "host-b",
		"name": "Chủ nhà B"
	}],
	sales: [
		{
			"id": "sale-mai",
			"name": "Mai"
		},
		{
			"id": "sale-b",
			"name": "Sale B"
		},
		{
			"id": "sale-c",
			"name": "Sale C"
		}
	],
	butlers: [{
		"id": "butler-linh",
		"name": "Linh",
		"villaIds": [
			"sao-bien",
			"huong-tram",
			"minh-dam",
			"gio-bien",
			"cat-vang",
			"sen-hong"
		]
	}],
	villas: [
		{
			"id": "sao-bien",
			"name": "Villa Sao Biển",
			"hostId": "host-a",
			"bedrooms": 4,
			"sleeps": 8,
			"nightlyPrice": 165e5,
			"setting": "beachfront",
			"photos": [
				"/images/villas/sao-bien-hero.jpg",
				"/images/villas/sao-bien-living.jpg",
				"/images/villas/bedroom.jpg",
				"/images/beach-club.jpg"
			]
		},
		{
			"id": "huong-tram",
			"name": "Villa Hương Tràm",
			"hostId": "host-a",
			"bedrooms": 3,
			"sleeps": 6,
			"nightlyPrice": 94e5,
			"setting": "garden",
			"photos": [
				"/images/villas/huong-tram-hero.jpg",
				"/images/villas/huong-tram-living.jpg",
				"/images/villas/bedroom.jpg",
				"/images/spa.jpg"
			]
		},
		{
			"id": "minh-dam",
			"name": "Villa Minh Đạm",
			"hostId": "host-a",
			"bedrooms": 5,
			"sleeps": 10,
			"nightlyPrice": 224e5,
			"setting": "hillside",
			"photos": [
				"/images/villas/minh-dam-hero.jpg",
				"/images/villas/minh-dam-terrace.jpg",
				"/images/villas/bedroom.jpg",
				"/images/oceanami-hero.jpg"
			]
		},
		{
			"id": "sen-hong",
			"name": "Villa Sen Hồng",
			"hostId": "host-b",
			"bedrooms": 2,
			"sleeps": 4,
			"nightlyPrice": 62e5,
			"setting": "garden",
			"photos": []
		},
		{
			"id": "gio-bien",
			"name": "Villa Gió Biển",
			"hostId": "host-b",
			"bedrooms": 3,
			"sleeps": 6,
			"nightlyPrice": 108e5,
			"setting": "garden",
			"photos": [
				"/images/villas/gio-bien-hero.jpg",
				"/images/villas/gio-bien-living.jpg",
				"/images/villas/bedroom.jpg",
				"/images/beach-club.jpg"
			]
		},
		{
			"id": "cat-vang",
			"name": "Villa Cát Vàng",
			"hostId": "host-b",
			"bedrooms": 4,
			"sleeps": 8,
			"nightlyPrice": 182e5,
			"setting": "beachfront",
			"photos": [
				"/images/villas/cat-vang-hero.jpg",
				"/images/villas/cat-vang-pool.jpg",
				"/images/villas/sao-bien-living.jpg",
				"/images/villas/bedroom.jpg"
			]
		}
	],
	existingStays: [
		{
			"villaId": "huong-tram",
			"checkIn": "2026-09-20",
			"checkOut": "2026-09-24",
			"guests": 4,
			"source": "Khách quen",
			"guestName": "Gia đình Trần"
		},
		{
			"villaId": "gio-bien",
			"checkIn": "2026-09-22",
			"checkOut": "2026-09-25",
			"guests": 4,
			"source": "Airbnb",
			"guestName": "Lê Minh"
		},
		{
			"villaId": "minh-dam",
			"checkIn": "2026-09-22",
			"checkOut": "2026-09-26",
			"guests": 8,
			"source": "Booking.com",
			"guestName": "Ngô Hà"
		},
		{
			"villaId": "sao-bien",
			"checkIn": "2026-09-18",
			"checkOut": "2026-09-22",
			"guests": 6,
			"source": "Khách quen",
			"guestName": "Mai Phương"
		},
		{
			"villaId": "cat-vang",
			"checkIn": "2026-10-16",
			"checkOut": "2026-10-19",
			"guests": 8,
			"source": "Zalo",
			"guestName": "Phạm Gia"
		}
	],
	blocks: [
		{
			"villaId": "sao-bien",
			"start": "2026-10-23",
			"end": "2026-10-27",
			"kind": "OWNER"
		},
		{
			"villaId": "huong-tram",
			"start": "2026-11-12",
			"end": "2026-11-16",
			"kind": "OWNER"
		},
		{
			"villaId": "minh-dam",
			"start": "2026-10-15",
			"end": "2026-10-21",
			"kind": "OWNER"
		},
		{
			"villaId": "sen-hong",
			"start": "2026-11-01",
			"end": "2026-11-05",
			"kind": "OWNER"
		},
		{
			"villaId": "gio-bien",
			"start": "2026-10-30",
			"end": "2026-11-03",
			"kind": "OWNER"
		},
		{
			"villaId": "cat-vang",
			"start": "2026-09-28",
			"end": "2026-10-03",
			"kind": "OWNER"
		}
	]
};
/** Destination name only — never a person, sale, butler or source. */
var DESTINATION_NAME = "Oceanami";
var PHONE_RE = /(?:^|[^\d])(?:\+?84|0)[\s.-]*[3-9](?:[\s.-]*\d){8}(?!\d)/;
var ID_RE = /(?<!\d)\d{12}(?!\d)|(?<!\d)\d{9}(?!\d)/;
function personFields(seed) {
	return [
		...seed.hosts.map((person) => ({
			kind: "host",
			name: person.name
		})),
		...seed.sales.map((person) => ({
			kind: "sale",
			name: person.name
		})),
		...seed.butlers.map((person) => ({
			kind: "butler",
			name: person.name
		})),
		...seed.existingStays.map((stay) => ({
			kind: "source",
			name: stay.source
		}))
	];
}
function identityStrings(seed) {
	return [
		...seed.hosts.map((person) => person.name),
		...seed.sales.map((person) => person.name),
		...seed.butlers.map((person) => person.name),
		...seed.existingStays.flatMap((stay) => [stay.source, stay.guestName ?? ""])
	];
}
function assertPilotSeed(seed, destinationName = DESTINATION_NAME) {
	const dest = destinationName.trim().toLowerCase();
	if (!dest) throw new Error("Destination name is required");
	for (const field of personFields(seed)) if (field.name.trim().toLowerCase() === dest) throw new Error(`${field.kind} name must not equal destination "${destinationName}"`);
	const hostIds = new Set(seed.hosts.map((person) => person.id));
	for (const villa of seed.villas) if (!hostIds.has(villa.hostId)) throw new Error(`Villa ${villa.id} references unknown host ${villa.hostId}`);
	for (const value of identityStrings(seed)) {
		if (PHONE_RE.test(value)) throw new Error("Seed must not contain phone numbers");
		if (ID_RE.test(value)) throw new Error("Seed must not contain ID numbers");
	}
}
var parsed = pilot_seed_default;
assertPilotSeed(parsed);
var PILOT_SEED = parsed;
var ROLE_STORAGE_KEY = "stayora-role";
var WORKSPACE = {
	GUEST: "/",
	SALE: "/sale",
	HOST: "/host",
	BUTLER: "/ops",
	BQL: "/ops",
	ADMIN: "/admin"
};
function workspaceFor(persona) {
	return WORKSPACE[persona];
}
function parseVai(raw) {
	if (!raw) return null;
	const value = raw.trim().toLowerCase();
	if (value === "khach" || value === "guest") return { persona: "GUEST" };
	if (value === "bql") return { persona: "BQL" };
	if (value === "admin") return { persona: "ADMIN" };
	if (value.startsWith("sale-")) return {
		persona: "SALE",
		saleId: raw.trim()
	};
	if (value.startsWith("host-")) return {
		persona: "HOST",
		hostId: raw.trim()
	};
	if (value.startsWith("butler-")) return {
		persona: "BUTLER",
		butlerId: raw.trim()
	};
	return null;
}
function vaiFor(role) {
	if (role.persona === "GUEST") return "khach";
	if (role.persona === "SALE") return role.saleId ?? "sale";
	if (role.persona === "HOST") return role.hostId ?? "host";
	if (role.persona === "BUTLER") return role.butlerId ?? "butler";
	if (role.persona === "BQL") return "bql";
	return "admin";
}
function actorFromRole(role) {
	if (role.persona === "SALE") return {
		persona: "SALE",
		saleId: role.saleId ?? ""
	};
	if (role.persona === "BUTLER") return {
		persona: "BUTLER",
		butlerId: role.butlerId ?? ""
	};
	if (role.persona === "HOST") return { persona: "HOST" };
	if (role.persona === "BQL") return { persona: "BQL" };
	if (role.persona === "ADMIN") return { persona: "ADMIN" };
	return { persona: "GUEST" };
}
function roleLinks() {
	return [
		{
			label: "Khách",
			vai: "khach",
			path: "/"
		},
		...PILOT_SEED.sales.map((person) => ({
			label: `Sale · ${person.name}`,
			vai: person.id,
			path: "/sale"
		})),
		...PILOT_SEED.hosts.map((person) => ({
			label: `Host · ${person.name}`,
			vai: person.id,
			path: "/host"
		})),
		...PILOT_SEED.butlers.map((person) => ({
			label: `Butler · ${person.name}`,
			vai: person.id,
			path: "/ops"
		})),
		{
			label: "BQL",
			vai: "bql",
			path: "/ops"
		},
		{
			label: "Stayora vận hành",
			vai: "admin",
			path: "/admin"
		}
	];
}
//#endregion
export { parseVai as a, workspaceFor as c, actorFromRole as i, PILOT_SEED as n, roleLinks as o, ROLE_STORAGE_KEY as r, vaiFor as s, DESTINATION_NAME as t };

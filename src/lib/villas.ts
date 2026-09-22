export type StayImage = {
  src: string;
  alt: string;
};

export type VillaSetting = "beachfront" | "garden" | "hillside";

export type AmenityId =
  | "pool"
  | "wifi"
  | "kitchen"
  | "beach"
  | "air"
  | "parking"
  | "bbq"
  | "washer"
  | "shower"
  | "club"
  | "housekeeping"
  | "workspace"
  | "baths";

export type Villa = {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  description: string[];
  setting: VillaSetting;
  settingLabel: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  sqm: number;
  nightly: number;
  rating: number;
  reviewCount: number;
  amenities: AmenityId[];
  sleeping: { title: string; detail: string }[];
  images: StayImage[];
  blocked: { start: string; end: string }[];
  reviews: { name: string; when: string; text: string }[];
};

export const DESTINATION = {
  name: "Oceanami",
  region: "Phước Hải, Bà Rịa–Vũng Tàu",
  country: "Việt Nam",
  travel: "About 2½ hours from Ho Chi Minh City by car",
  address: "QL44A, Phước Hải, Đất Đỏ, Bà Rịa–Vũng Tàu",
  intro:
    "A quiet stretch of Phước Hải beach, with Minh Đạm mountain at its back. Private villas sit in tropical gardens, a short walk from the sand and the beach club.",
};

export const villas: Villa[] = [
  {
    id: "sao-bien",
    name: "Villa Sao Biển",
    tagline: "Four bedrooms, an infinity pool, and the sea at the garden edge.",
    summary: "Beachfront villa with a linear pool that meets the East Sea.",
    description: [
      "Sao Biển sits on the first line of Oceanami, with a long limestone deck and an infinity pool that visually joins the water. Mornings here are about the horizon; afternoons, about shade and the slow walk to the sand.",
      "The house opens completely to the garden. Four bedrooms are split across two wings, so a family or two couples can keep their own quiet without losing the shared table.",
    ],
    setting: "beachfront",
    settingLabel: "Beachfront",
    bedrooms: 4,
    bathrooms: 4,
    sleeps: 8,
    sqm: 320,
    nightly: 16_500_000,
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
      "washer",
    ],
    sleeping: [
      { title: "Ocean suite", detail: "King bed, sea view, ensuite" },
      { title: "Garden suite", detail: "King bed, garden view, ensuite" },
      { title: "Twin room", detail: "Two single beds, ensuite" },
      { title: "Pool room", detail: "Queen bed, opens to the deck" },
    ],
    images: [
      {
        src: "/images/villas/sao-bien-hero.jpg",
        alt: "Infinity pool of Villa Sao Biển looking out to the East Sea",
      },
      {
        src: "/images/villas/sao-bien-living.jpg",
        alt: "Open living room with linen sofas facing the pool and ocean",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "King bedroom with white linen and a garden window",
      },
      {
        src: "/images/beach-club.jpg",
        alt: "Oceanami beach club along Phước Hải beach",
      },
    ],
    blocked: [{ start: "2026-10-23", end: "2026-10-27" }],
    reviews: [
      {
        name: "Mai",
        when: "August 2026",
        text: "The pool really does meet the sea. We cooked one night and ate at the beach club the next. Easy with two children.",
      },
      {
        name: "James",
        when: "May 2026",
        text: "Quiet in the mornings, staff nearby without hovering. The house is the stay — we barely left the deck.",
      },
    ],
  },
  {
    id: "huong-tram",
    name: "Villa Hương Tràm",
    tagline: "A garden house for six, screened in timber and tropical green.",
    summary: "Secluded three-bedroom villa in a dense garden, with a private pool.",
    description: [
      "Hương Tràm is held in the trees. Dark timber screens and a green pool keep the house cool, and the garden swallows sound from the path. It is the villa people choose when they want Oceanami without sitting on the sand.",
      "The dining table looks into the foliage. Three bedrooms share a single generous living room — right for a family, or three friends who still want their own door.",
    ],
    setting: "garden",
    settingLabel: "Garden",
    bedrooms: 3,
    bathrooms: 3,
    sleeps: 6,
    sqm: 240,
    nightly: 9_400_000,
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
      "workspace",
    ],
    sleeping: [
      { title: "Main suite", detail: "King bed, garden view, ensuite" },
      { title: "Verandah room", detail: "Queen bed, opens to the pool" },
      { title: "Twin room", detail: "Two single beds, ensuite" },
    ],
    images: [
      {
        src: "/images/villas/huong-tram-hero.jpg",
        alt: "Garden pool of Villa Hương Tràm framed by tropical plants",
      },
      {
        src: "/images/villas/huong-tram-living.jpg",
        alt: "Dining room with rattan and teak looking onto the garden",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Quiet bedroom with garden light",
      },
      {
        src: "/images/spa.jpg",
        alt: "Oceanami spa treatment room",
      },
    ],
    blocked: [{ start: "2026-11-12", end: "2026-11-16" }],
    reviews: [
      {
        name: "Linh",
        when: "July 2026",
        text: "We could hear the sea and still felt hidden. The garden is the whole character of the house.",
      },
      {
        name: "Anh",
        when: "March 2026",
        text: "Beautifully kept, and the walk to the beach club is short. Would return for a long weekend.",
      },
    ],
  },
  {
    id: "minh-dam",
    name: "Villa Minh Đạm",
    tagline: "Five bedrooms on the hill, with the sea in front and the mountain behind.",
    summary: "The largest house — dual views, a wide terrace, and room for ten.",
    description: [
      "Named for the mountain it leans against, Minh Đạm is the lookout. The terrace holds a long table and a view that splits sea from forest. It is the villa for a reunion, a multi-family stay, or anyone who wants height and quiet.",
      "Five bedrooms step down the slope. Sunset is the event; the rest of the day can be the pool, the beach club, or not leaving the terrace at all.",
    ],
    setting: "hillside",
    settingLabel: "Hillside",
    bedrooms: 5,
    bathrooms: 5,
    sleeps: 10,
    sqm: 480,
    nightly: 22_400_000,
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
      "baths",
    ],
    sleeping: [
      { title: "Lookout suite", detail: "King bed, sea and mountain view" },
      { title: "East suite", detail: "King bed, sea view, ensuite" },
      { title: "Forest suite", detail: "King bed, mountain view" },
      { title: "Twin room", detail: "Two single beds" },
      { title: "Garden room", detail: "Queen bed, lower terrace" },
    ],
    images: [
      {
        src: "/images/villas/minh-dam-hero.jpg",
        alt: "Hillside Villa Minh Đạm at dusk overlooking sea and mountain",
      },
      {
        src: "/images/villas/minh-dam-terrace.jpg",
        alt: "Terrace dining table looking toward the East Sea",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "King bedroom with garden and sea light",
      },
      {
        src: "/images/oceanami-hero.jpg",
        alt: "Oceanami villas between Phước Hải beach and Minh Đạm mountain",
      },
    ],
    blocked: [{ start: "2026-10-15", end: "2026-10-21" }],
    reviews: [
      {
        name: "Hạnh",
        when: "April 2026",
        text: "We were twelve at dinner on the terrace and it still felt considered. The view does half the hosting.",
      },
      {
        name: "Daniel",
        when: "January 2026",
        text: "A proper family house. High enough to be quiet, close enough to walk down for a swim.",
      },
    ],
  },
  {
    id: "sen-hong",
    name: "Villa Sen Hồng",
    tagline: "Two bedrooms around a lotus courtyard — small, still, and close.",
    summary: "An intimate courtyard villa for two to four, built around water.",
    description: [
      "Sen Hồng is the smallest house in this collection, and the most inward. A lotus pond holds the courtyard; the rooms look at water and plaster rather than the open sea. Couples stay here. So do close friends who want a quieter rhythm than a beachfront deck.",
      "The beach is still a short walk. What you give up in horizon, you gain in hush.",
    ],
    setting: "garden",
    settingLabel: "Courtyard",
    bedrooms: 2,
    bathrooms: 2,
    sleeps: 4,
    sqm: 160,
    nightly: 6_200_000,
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
      "baths",
    ],
    sleeping: [
      { title: "Courtyard suite", detail: "King bed, pond view, ensuite" },
      { title: "Upper room", detail: "Queen bed, garden window" },
    ],
    images: [
      {
        src: "/images/villas/sen-hong-hero.jpg",
        alt: "Courtyard of Villa Sen Hồng with a still lotus pond",
      },
      {
        src: "/images/villas/sen-hong-courtyard.jpg",
        alt: "Lotus pond and daybed in the Sen Hồng courtyard",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Calm bedroom with white linen",
      },
      {
        src: "/images/spa.jpg",
        alt: "Quiet spa room at Oceanami",
      },
    ],
    blocked: [{ start: "2026-11-01", end: "2026-11-05" }],
    reviews: [
      {
        name: "Trang",
        when: "June 2026",
        text: "We wanted somewhere small. The courtyard is the whole stay — we read, we swam, we didn't perform a holiday.",
      },
      {
        name: "Olivier",
        when: "February 2026",
        text: "Tactile and quiet. Not a show villa, which is exactly why we booked it.",
      },
    ],
  },
  {
    id: "gio-bien",
    name: "Villa Gió Biển",
    tagline: "A bright family house with a generous pool and a proper kitchen.",
    summary: "Three-bedroom family villa near the beach club, built for a full table.",
    description: [
      "Gió Biển is the practical luxury house: a shallow sun shelf in the pool, a kitchen that actually works for eight, and a lawn where children can disappear for an hour. The beach club is close enough that no one has to drive.",
      "Adults still get a quiet main suite. The rest of the house is sociable on purpose.",
    ],
    setting: "garden",
    settingLabel: "Near the beach club",
    bedrooms: 3,
    bathrooms: 3,
    sleeps: 6,
    sqm: 260,
    nightly: 10_800_000,
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
      "washer",
    ],
    sleeping: [
      { title: "Main suite", detail: "King bed, garden view, ensuite" },
      { title: "Pool room", detail: "Queen bed, opens to the deck" },
      { title: "Twin room", detail: "Two single beds, garden view" },
    ],
    images: [
      {
        src: "/images/villas/gio-bien-hero.jpg",
        alt: "Family pool and lawn at Villa Gió Biển",
      },
      {
        src: "/images/villas/gio-bien-living.jpg",
        alt: "Open kitchen and dining table looking onto the pool",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Bedroom with garden light",
      },
      {
        src: "/images/beach-club.jpg",
        alt: "Beach club a short walk from the villa",
      },
    ],
    blocked: [{ start: "2026-10-30", end: "2026-11-03" }],
    reviews: [
      {
        name: "Hương",
        when: "August 2026",
        text: "The kitchen saved us. We had three children and never felt packed. Pool shelf is a gift.",
      },
      {
        name: "Tom",
        when: "May 2026",
        text: "Family stay without the resort-room feeling. We walked to the beach club every afternoon.",
      },
    ],
  },
  {
    id: "cat-vang",
    name: "Villa Cát Vàng",
    tagline: "Steps from the sand, with an outdoor kitchen and the sea as a neighbour.",
    summary: "Four-bedroom pavilion villa, a few paces from Phước Hải beach.",
    description: [
      "Cát Vàng lives on the sand side of Oceanami. A timber pavilion holds the living and the outdoor kitchen; the pool sits between the house and a low hedge, and then it is beach. Barefoot is the dress code.",
      "Four bedrooms make it easy for two families. Evenings collect around the grill; mornings, around the water.",
    ],
    setting: "beachfront",
    settingLabel: "On the sand",
    bedrooms: 4,
    bathrooms: 4,
    sleeps: 8,
    sqm: 340,
    nightly: 18_200_000,
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
      "washer",
    ],
    sleeping: [
      { title: "Pavilion suite", detail: "King bed, sea breeze, ensuite" },
      { title: "Garden suite", detail: "King bed, ensuite" },
      { title: "Twin room", detail: "Two single beds" },
      { title: "Pool room", detail: "Queen bed, deck access" },
    ],
    images: [
      {
        src: "/images/villas/cat-vang-hero.jpg",
        alt: "Pavilion living and pool at Villa Cát Vàng beside the beach",
      },
      {
        src: "/images/villas/cat-vang-pool.jpg",
        alt: "Private pool with Phước Hải beach just beyond",
      },
      {
        src: "/images/villas/sao-bien-living.jpg",
        alt: "Open living looking toward water",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Bedroom with white linen and garden light",
      },
    ],
    blocked: [{ start: "2026-09-28", end: "2026-10-03" }],
    reviews: [
      {
        name: "Ngọc",
        when: "July 2026",
        text: "We were in the sea before breakfast. The outdoor kitchen is the heart of the house.",
      },
      {
        name: "Elena",
        when: "April 2026",
        text: "As close to the beach as I would want with children. Beautiful at golden hour.",
      },
    ],
  },
];

export function getVilla(id: string): Villa | undefined {
  return villas.find((villa) => villa.id === id);
}

export const AMENITY_LABELS: Record<AmenityId, string> = {
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
  baths: "Deep soaking tub",
};

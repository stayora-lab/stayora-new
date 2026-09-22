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
  amenities: AmenityId[];
  sleeping: { title: string; detail: string }[];
  images: StayImage[];
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
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/sao-bien-living.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/beach-club.jpg",
        alt: "Ảnh minh hoạ",
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
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/huong-tram-living.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/spa.jpg",
        alt: "Ảnh minh hoạ",
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
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/minh-dam-terrace.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/oceanami-hero.jpg",
        alt: "Ảnh minh hoạ",
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
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/sen-hong-courtyard.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/spa.jpg",
        alt: "Ảnh minh hoạ",
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
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/gio-bien-living.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/beach-club.jpg",
        alt: "Ảnh minh hoạ",
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
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/cat-vang-pool.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/sao-bien-living.jpg",
        alt: "Ảnh minh hoạ",
      },
      {
        src: "/images/villas/bedroom.jpg",
        alt: "Ảnh minh hoạ",
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

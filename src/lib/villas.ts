import { PILOT_SEED, DESTINATION_NAME, type PilotVilla } from "./pilot-data.ts";
import { DESTINATION, photosForVilla } from "./destination.ts";

export type StayImage = {
  src: string;
  alt: string;
  illustration?: boolean;
};

export type VillaSetting = "beachfront" | "garden" | "hillside";

export type AmenityId =
  | "pool"
  | "wifi"
  | "kitchen"
  | "air"
  | "parking"
  | "bbq"
  | "washer"
  | "shower"
  | "housekeeping"
  | "workspace"
  | "baths";

export type Villa = {
  id: string;
  name: string;
  hostId: string;
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

export { DESTINATION, DESTINATION_NAME };

const SETTING_LABEL: Record<VillaSetting, string> = {
  beachfront: "Ven biển",
  garden: "Vườn",
  hillside: "Sườn núi",
};

function villaFromSeed(row: PilotVilla): Villa {
  const setting: VillaSetting = row.setting ?? "garden";
  return {
    id: row.id,
    name: row.name,
    hostId: row.hostId,
    tagline: `${row.bedrooms} phòng ngủ · ngủ ${row.sleeps}`,
    summary: `${row.name} · ${row.bedrooms} phòng ngủ, ${row.sleeps} khách.`,
    description: [`${row.name} tại Oceanami · Phước Hải.`],
    setting,
    settingLabel: SETTING_LABEL[setting],
    bedrooms: row.bedrooms,
    bathrooms: row.bedrooms,
    sleeps: row.sleeps,
    sqm: row.bedrooms * 80,
    nightly: row.nightlyPrice,
    amenities: ["pool", "wifi", "kitchen", "air", "housekeeping"],
    sleeping: Array.from({ length: row.bedrooms }, (_, index) => ({
      title: `Phòng ${index + 1}`,
      detail: "Giường lớn",
    })),
    images: photosForVilla(row.id, row.name),
  };
}

export const villas: Villa[] = PILOT_SEED.villas.map(villaFromSeed);
export const hosts = PILOT_SEED.hosts;
export const salesPeople = PILOT_SEED.sales;
export const butlerPeople = PILOT_SEED.butlers;

export function getVilla(id: string): Villa | undefined {
  return villas.find((villa) => villa.id === id);
}

export function villasForHost(hostId: string | undefined): Villa[] {
  if (!hostId) return [];
  return villas.filter((villa) => villa.hostId === hostId);
}

export function hostOwnsVilla(hostId: string | undefined, villaId: string): boolean {
  if (!hostId) return false;
  return getVilla(villaId)?.hostId === hostId;
}

export const AMENITY_LABELS: Record<AmenityId, string> = {
  pool: "Hồ bơi riêng",
  wifi: "Wifi",
  kitchen: "Bếp",
  air: "Máy lạnh",
  parking: "Chỗ đậu xe",
  bbq: "Bếp ngoài trời",
  washer: "Máy giặt",
  shower: "Vòi sen ngoài trời",
  housekeeping: "Dọn phòng",
  workspace: "Bàn làm việc",
  baths: "Bồn tắm",
};

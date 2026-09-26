import {
  ABOUT_BODY,
  ABOUT_TITLE,
  AROUND_BODY,
  AROUND_TITLE,
  ARRIVAL_BODY,
  ARRIVAL_TITLE,
  GUEST_ARRIVAL,
  HERO_SLIDES,
  HERO_SUBTITLE,
  HERO_TITLE,
  LOCATION_LABEL,
} from "../content/destination-oceanami.ts";
import { photosInFolder } from "./photos.ts";

export {
  ABOUT_BODY,
  ABOUT_TITLE,
  AMENITIES,
  AMENITIES_FOOTNOTE,
  AMENITIES_FREE,
  AMENITIES_FREE_INTRO,
  AMENITIES_FREE_TITLE,
  AMENITIES_PAID,
  AMENITIES_PAID_TITLE,
  AMENITIES_SECTION_ID,
  AMENITY_CARDS,
  AROUND_BODY,
  AROUND_TITLE,
  ARRIVAL_BODY,
  ARRIVAL_TITLE,
  GUEST_ARRIVAL,
  GYM_PHOTOS,
  HERO_SLIDES,
  HERO_SUBTITLE,
  HERO_TITLE,
  LOCATION_LABEL,
  MAISON_PHOTOS,
  VILLA_COMMON_AMENITIES_LINE,
  formatAmenityHours,
} from "../content/destination-oceanami.ts";

export const DESTINATION_COPY = {
  namePlace: { title: HERO_TITLE, body: HERO_SUBTITLE },
  about: { title: ABOUT_TITLE, body: ABOUT_BODY },
  around: { title: AROUND_TITLE, body: AROUND_BODY },
  arrival: { title: ARRIVAL_TITLE, body: ARRIVAL_BODY },
} as const;

export const DESTINATION = {
  name: "Oceanami",
  region: "Phước Hải",
  country: "Việt Nam",
  locationLabel: LOCATION_LABEL,
  intro: ABOUT_BODY,
  travel: ARRIVAL_BODY,
};

export type DestinationPhoto = {
  file: string;
  src: string;
  alt: string;
  illustration: boolean;
};

export const DESTINATION_PHOTOS: DestinationPhoto[] = HERO_SLIDES.map((slide) => ({
  file: slide.file,
  src: slide.src,
  alt: slide.alt,
  illustration:
    photosInFolder("destination").find((row) => row.file === slide.file)?.type ===
    "ai-generated",
}));

export function photosForVilla(
  villaId: string,
  villaName: string,
): { src: string; alt: string; illustration: boolean }[] {
  return photosInFolder(villaId).map((photo) => ({
    src: photo.src,
    alt:
      photo.type === "ai-generated"
        ? `${villaName} — ảnh minh hoạ`
        : villaName,
    illustration: photo.type === "ai-generated",
  }));
}

import destinationSources from "../../public/photos/destination/SOURCES.json" with { type: "json" };
import saoBienSources from "../../public/photos/sao-bien/SOURCES.json" with { type: "json" };
import huongTramSources from "../../public/photos/huong-tram/SOURCES.json" with { type: "json" };
import minhDamSources from "../../public/photos/minh-dam/SOURCES.json" with { type: "json" };
import senHongSources from "../../public/photos/sen-hong/SOURCES.json" with { type: "json" };
import gioBienSources from "../../public/photos/gio-bien/SOURCES.json" with { type: "json" };
import catVangSources from "../../public/photos/cat-vang/SOURCES.json" with { type: "json" };

export type PhotoType = "real" | "ai-generated";

export type PhotoProvenance = {
  file: string;
  type: PhotoType;
  sourceUrl?: string;
  sourceSite?: string;
  addedAt: string;
  approvedBy: "Founder";
  note?: string;
};

export type CatalogPhoto = PhotoProvenance & {
  folder: string;
  src: string;
};

const FOLDERS: { folder: string; rows: PhotoProvenance[] }[] = [
  { folder: "destination", rows: destinationSources as PhotoProvenance[] },
  { folder: "sao-bien", rows: saoBienSources as PhotoProvenance[] },
  { folder: "huong-tram", rows: huongTramSources as PhotoProvenance[] },
  { folder: "minh-dam", rows: minhDamSources as PhotoProvenance[] },
  { folder: "sen-hong", rows: senHongSources as PhotoProvenance[] },
  { folder: "gio-bien", rows: gioBienSources as PhotoProvenance[] },
  { folder: "cat-vang", rows: catVangSources as PhotoProvenance[] },
];

export const PHOTO_CATALOG: CatalogPhoto[] = FOLDERS.flatMap(({ folder, rows }) =>
  rows.map((row) => ({
    ...row,
    folder,
    src: `/photos/${folder}/${row.file}`,
  })),
);

const BY_SRC = new Map(PHOTO_CATALOG.map((photo) => [photo.src, photo]));

export function provenanceFor(src: string): CatalogPhoto | undefined {
  return BY_SRC.get(src);
}

export function isIllustration(src: string): boolean {
  return provenanceFor(src)?.type === "ai-generated";
}

export function photosInFolder(folder: string): CatalogPhoto[] {
  return PHOTO_CATALOG.filter((photo) => photo.folder === folder);
}

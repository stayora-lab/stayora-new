import destinationSources from "../../public/photos/destination/SOURCES.json" with { type: "json" };
import t01 from "../../public/photos/t01/SOURCES.json" with { type: "json" };
import t02 from "../../public/photos/t02/SOURCES.json" with { type: "json" };
import t03 from "../../public/photos/t03/SOURCES.json" with { type: "json" };
import t04 from "../../public/photos/t04/SOURCES.json" with { type: "json" };
import t05 from "../../public/photos/t05/SOURCES.json" with { type: "json" };
import t06 from "../../public/photos/t06/SOURCES.json" with { type: "json" };
import t07 from "../../public/photos/t07/SOURCES.json" with { type: "json" };
import t08 from "../../public/photos/t08/SOURCES.json" with { type: "json" };
import t09 from "../../public/photos/t09/SOURCES.json" with { type: "json" };
import t10 from "../../public/photos/t10/SOURCES.json" with { type: "json" };
import t11 from "../../public/photos/t11/SOURCES.json" with { type: "json" };
import t12 from "../../public/photos/t12/SOURCES.json" with { type: "json" };
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
  { folder: "t01", rows: t01 as PhotoProvenance[] },
  { folder: "t02", rows: t02 as PhotoProvenance[] },
  { folder: "t03", rows: t03 as PhotoProvenance[] },
  { folder: "t04", rows: t04 as PhotoProvenance[] },
  { folder: "t05", rows: t05 as PhotoProvenance[] },
  { folder: "t06", rows: t06 as PhotoProvenance[] },
  { folder: "t07", rows: t07 as PhotoProvenance[] },
  { folder: "t08", rows: t08 as PhotoProvenance[] },
  { folder: "t09", rows: t09 as PhotoProvenance[] },
  { folder: "t10", rows: t10 as PhotoProvenance[] },
  { folder: "t11", rows: t11 as PhotoProvenance[] },
  { folder: "t12", rows: t12 as PhotoProvenance[] },
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

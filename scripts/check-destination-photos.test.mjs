import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkDestinationPhotos } from "./check-destination-photos.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("workspace destination photos are all listed in SOURCES.json", () => {
  const result = checkDestinationPhotos(ROOT);
  assert.ok(result.files >= 1);
});

test("fails when a destination file is missing from SOURCES.json", () => {
  const root = mkdtempSync(join(tmpdir(), "dest-photos-"));
  const dir = join(root, "public/photos/destination");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SOURCES.json"),
    JSON.stringify([
      {
        file: "beach.jpg",
        sourceUrl: "https://oceanami.com/x.jpg",
        sourceSite: "oceanami.com",
        fetchedAt: "2026-09-22T00:00:00+07:00",
        approvedBy: "Founder",
        note: "ok",
      },
    ]),
  );
  writeFileSync(join(dir, "beach.jpg"), "x");
  writeFileSync(join(dir, "orphan.jpg"), "x");
  assert.throws(
    () => checkDestinationPhotos(root),
    /orphan\.jpg is in public\/photos\/destination\/ but missing from SOURCES\.json/,
  );
});

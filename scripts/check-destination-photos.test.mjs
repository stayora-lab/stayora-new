import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkDestinationPhotos } from "./check-destination-photos.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function writeSources(dir, rows) {
  writeFileSync(join(dir, "SOURCES.json"), JSON.stringify(rows));
}

test("workspace destination and villa photos are all listed in SOURCES.json", () => {
  const result = checkDestinationPhotos(ROOT);
  assert.ok(result.files >= 1);
  assert.ok(result.folders >= 2);
});

test("fails when a destination file is missing from SOURCES.json", () => {
  const root = mkdtempSync(join(tmpdir(), "dest-photos-"));
  const dir = join(root, "public/photos/destination");
  mkdirSync(dir, { recursive: true });
  writeSources(dir, [
    {
      file: "beach.jpg",
      type: "real",
      addedAt: "2026-09-22T00:00:00+07:00",
      approvedBy: "Founder",
    },
  ]);
  writeFileSync(join(dir, "beach.jpg"), "x");
  writeFileSync(join(dir, "orphan.jpg"), "x");
  assert.throws(
    () => checkDestinationPhotos(root),
    /destination\/orphan\.jpg is in public\/photos\/destination\/ but missing from SOURCES\.json/,
  );
});

test("fails when a villa image is missing from SOURCES.json", () => {
  const root = mkdtempSync(join(tmpdir(), "villa-photos-"));
  const dest = join(root, "public/photos/destination");
  const villa = join(root, "public/photos/sao-bien");
  mkdirSync(dest, { recursive: true });
  mkdirSync(villa, { recursive: true });
  writeSources(dest, []);
  writeSources(villa, []);
  writeFileSync(join(villa, "hero.jpg"), "x");
  assert.throws(
    () => checkDestinationPhotos(root),
    /sao-bien\/hero\.jpg is in public\/photos\/sao-bien\/ but missing from SOURCES\.json/,
  );
});

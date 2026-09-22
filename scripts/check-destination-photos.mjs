#!/usr/bin/env node
/**
 * Fail the build if a file in public/photos/destination/ is not listed in
 * SOURCES.json (provenance). Also fail if a listed file is missing.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./with-app-env.mjs";

const REQUIRED = ["file", "sourceUrl", "sourceSite", "fetchedAt", "approvedBy", "note"];

export function checkDestinationPhotos(root = process.cwd()) {
  const dir = join(root, "public/photos/destination");
  const sourcesPath = join(dir, "SOURCES.json");
  if (!existsSync(sourcesPath)) {
    throw new Error("public/photos/destination/SOURCES.json is missing");
  }
  const sources = JSON.parse(readFileSync(sourcesPath, "utf8"));
  if (!Array.isArray(sources)) {
    throw new Error("SOURCES.json must be an array of provenance records");
  }
  const listed = new Set();
  for (const row of sources) {
    for (const key of REQUIRED) {
      if (!row?.[key] || typeof row[key] !== "string") {
        throw new Error(`SOURCES.json entry missing ${key}`);
      }
    }
    if (row.approvedBy !== "Founder") {
      throw new Error(`SOURCES.json ${row.file}: approvedBy must be "Founder"`);
    }
    if (listed.has(row.file)) {
      throw new Error(`SOURCES.json lists ${row.file} twice`);
    }
    listed.add(row.file);
    const filePath = join(dir, row.file);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new Error(`SOURCES.json lists ${row.file} but the file is missing`);
    }
  }
  const onDisk = readdirSync(dir).filter((name) => {
    if (name === "SOURCES.json" || name.startsWith(".")) return false;
    return statSync(join(dir, name)).isFile();
  });
  for (const name of onDisk) {
    if (!listed.has(name)) {
      throw new Error(`${name} is in public/photos/destination/ but missing from SOURCES.json`);
    }
  }
  return { files: onDisk.length };
}

if (isMainModule(import.meta.url)) {
  try {
    const result = checkDestinationPhotos(join(dirname(fileURLToPath(import.meta.url)), ".."));
    console.log(`destination photos ok (${result.files} files)`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

#!/usr/bin/env node
/**
 * Fail the build if any image under public/photos/ is missing from that
 * folder's SOURCES.json (provenance). Also fail if a listed file is missing.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./with-app-env.mjs";

const REQUIRED = ["file", "type", "addedAt", "approvedBy"];
const TYPES = new Set(["real", "ai-generated"]);
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

export function checkDestinationPhotos(root = process.cwd()) {
  const photosRoot = join(root, "public/photos");
  if (!existsSync(photosRoot)) {
    throw new Error("public/photos is missing");
  }
  const folders = readdirSync(photosRoot).filter((name) =>
    statSync(join(photosRoot, name)).isDirectory(),
  );
  if (folders.length === 0) {
    throw new Error("public/photos has no folders");
  }
  let files = 0;
  for (const folder of folders) {
    files += checkFolder(join(photosRoot, folder), folder);
  }
  return { files, folders: folders.length };
}

function checkFolder(dir, folder) {
  const sourcesPath = join(dir, "SOURCES.json");
  if (!existsSync(sourcesPath)) {
    throw new Error(`public/photos/${folder}/SOURCES.json is missing`);
  }
  const sources = JSON.parse(readFileSync(sourcesPath, "utf8"));
  if (!Array.isArray(sources)) {
    throw new Error(`public/photos/${folder}/SOURCES.json must be an array`);
  }
  const listed = new Set();
  for (const row of sources) {
    for (const key of REQUIRED) {
      if (!row?.[key] || typeof row[key] !== "string") {
        throw new Error(`public/photos/${folder}/SOURCES.json entry missing ${key}`);
      }
    }
    if (!TYPES.has(row.type)) {
      throw new Error(`public/photos/${folder}/${row.file}: type must be real or ai-generated`);
    }
    if (row.approvedBy !== "Founder") {
      throw new Error(`public/photos/${folder}/${row.file}: approvedBy must be "Founder"`);
    }
    if (listed.has(row.file)) {
      throw new Error(`public/photos/${folder}/SOURCES.json lists ${row.file} twice`);
    }
    listed.add(row.file);
    const filePath = join(dir, row.file);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new Error(`SOURCES.json lists ${folder}/${row.file} but the file is missing`);
    }
  }
  const onDisk = readdirSync(dir).filter((name) => {
    if (name === "SOURCES.json" || name.startsWith(".")) return false;
    if (!IMAGE_EXT.test(name)) return false;
    return statSync(join(dir, name)).isFile();
  });
  for (const name of onDisk) {
    if (!listed.has(name)) {
      throw new Error(
        `${folder}/${name} is in public/photos/${folder}/ but missing from SOURCES.json`,
      );
    }
  }
  return onDisk.length;
}

if (isMainModule(import.meta.url)) {
  try {
    const result = checkDestinationPhotos(join(dirname(fileURLToPath(import.meta.url)), ".."));
    console.log(`photos ok (${result.files} files in ${result.folders} folders)`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

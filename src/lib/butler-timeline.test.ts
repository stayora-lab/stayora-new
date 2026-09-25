import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { butlerFieldBoard } from "./domain/engine.ts";
import { PILOT_SEED } from "./pilot-data.ts";
import { seedFromPilot } from "./seed-pilot.ts";
import { getVilla } from "./villas.ts";
import {
  addIsoDays,
  boardIsEmpty,
  dateFromStrip,
  emptyDayMessage,
  nextUpcoming,
  relativeDayPhrase,
  upcomingMoves,
  viewedDate,
  viewedDayLabel,
} from "./butler-timeline.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript") as typeof import("typescript");

const NOW = "2026-09-24T02:00:00.000Z";
const TODAY = "2026-09-24";

function filePath(url: URL): string {
  return url.pathname;
}

async function renderView(name: string, props: Record<string, unknown>): Promise<string> {
  const here = filePath(new URL(".", import.meta.url));
  const outDir = mkdtempSync(join(here, ".day-strip-"));
  try {
    const source = readFileSync(new URL("../components/butler-day-strip.tsx", import.meta.url), "utf8")
      .replaceAll("../lib/privacy.ts", pathToFileURL(join(here, "privacy.ts")).href)
      .replaceAll("../lib/butler-timeline.ts", pathToFileURL(join(here, "butler-timeline.ts")).href)
      .replaceAll("../lib/villas.ts", pathToFileURL(join(here, "villas.ts")).href);
    const js = ts.transpileModule(source, {
      fileName: "butler-day-strip.tsx",
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    writeFileSync(join(outDir, "strip.js"), js);
    const mod = await import(pathToFileURL(join(outDir, "strip.js")).href);
    return renderToStaticMarkup(createElement(mod[name], props));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

describe("butler day strip", () => {
  const world = seedFromPilot(NOW);
  const scope = PILOT_SEED.butlers.find((person) => person.id === "butler-chi")?.villaIds ?? [];

  it("opens on today, and one tap is yesterday or tomorrow", async () => {
    assert.equal(viewedDate(TODAY, null), TODAY);
    assert.equal(dateFromStrip(TODAY, "yesterday"), "2026-09-23");
    assert.equal(dateFromStrip(TODAY, "tomorrow"), "2026-09-25");
    const page = readFileSync(new URL("../routes/ops.tsx", import.meta.url), "utf8");
    assert.match(page, /viewedDate\(today, pickedDate\)/);
    assert.match(page, /useState<string \| null>\(null\)/);
    assert.match(page, /ButlerDayStrip/);
    assert.match(page, /Nhảy tới ngày/);
    assert.equal(page.includes('label="Ngày"'), false);

    const strip = await renderView("ButlerDayStrip", {
      today: TODAY,
      viewed: TODAY,
      onView: () => undefined,
    });
    assert.match(strip, /data-day-strip/);
    assert.match(strip, /data-day="yesterday"/);
    assert.match(strip, /data-day="today"/);
    assert.match(strip, /data-day="tomorrow"/);
    assert.equal(strip.match(/aria-pressed="true"/g)?.length, 1);
    assert.match(strip, /Hôm qua/);
    assert.match(strip, /Ngày mai/);
  });

  it("styles another day so it cannot be mistaken for today", async () => {
    assert.equal(viewedDayLabel(TODAY, TODAY), "Hôm nay");
    assert.equal(viewedDayLabel(TODAY, "2026-09-25"), "Đang xem: Ngày mai");
    const todayHtml = await renderView("ViewedDayLabel", { today: TODAY, viewed: TODAY });
    const tomorrowHtml = await renderView("ViewedDayLabel", { today: TODAY, viewed: "2026-09-25" });
    assert.match(todayHtml, /data-viewed-day="today"/);
    assert.match(todayHtml, /Hôm nay/);
    assert.doesNotMatch(todayHtml, /Đang xem/);
    assert.doesNotMatch(todayHtml, /bg-lotus/);
    assert.match(tomorrowHtml, /data-viewed-day="other"/);
    assert.match(tomorrowHtml, /Đang xem: Ngày mai/);
    assert.match(tomorrowHtml, /bg-lotus/);
  });

  it("an empty day names the next upcoming stay instead of a bare empty line", () => {
    let quiet = "";
    for (let offset = -3; offset <= 20; offset += 1) {
      const date = addIsoDays(TODAY, offset);
      const board = butlerFieldBoard(world, date, scope);
      if (!boardIsEmpty(board)) continue;
      if (!nextUpcoming(world, scope, date)) continue;
      quiet = date;
      break;
    }
    assert.ok(quiet, "expected an empty day with something later");
    const next = nextUpcoming(world, scope, quiet);
    assert.ok(next);
    const villaName = getVilla(next.stay.villaId)?.name ?? next.stay.villaId;
    const message = emptyDayMessage(quiet === TODAY, {
      villaName,
      arriving: next.lane !== "departing",
      when: relativeDayPhrase(TODAY, next.date),
    });
    assert.match(message, new RegExp(`Việc gần nhất: ${villaName}`));
    assert.match(message, next.lane === "departing" ? /khách đi/ : /khách đến/);
    assert.equal(message.includes("Không có."), false);
    const ahead = upcomingMoves(world, scope, TODAY);
    assert.ok(ahead.length > 0);
    assert.ok(ahead.every((hit) => hit.date > TODAY && hit.date <= addIsoDays(TODAY, 4)));
  });
});

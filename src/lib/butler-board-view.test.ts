import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  cardOrder,
  dayLayout,
  findCard,
  weekDays,
  type BoardFlags,
} from "./butler-board-view.ts";
import type { World } from "./domain/types.ts";
import { PILOT_SEED } from "./pilot-data.ts";
import { seedFromPilot } from "./seed-pilot.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript") as typeof import("typescript");

const NOW = "2026-09-24T02:00:00.000Z";
const TODAY = "2026-09-24";
const FLAGS: BoardFlags = { canAct: true, canHold: false };

function filePath(url: URL): string {
  return url.pathname;
}

function todayIct(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

async function render(name: string, props: Record<string, unknown>): Promise<string> {
  const here = filePath(new URL(".", import.meta.url));
  const outDir = mkdtempSync(join(here, ".villa-card-"));
  try {
    const source = readFileSync(new URL("../components/butler-villa-card.tsx", import.meta.url), "utf8")
      .replaceAll("../lib/butler-board-view.ts", pathToFileURL(join(here, "butler-board-view.ts")).href)
      .replaceAll("../lib/domain/types.ts", pathToFileURL(join(here, "domain/types.ts")).href)
      .replaceAll("../lib/privacy.ts", pathToFileURL(join(here, "privacy.ts")).href)
      .replaceAll("../lib/role.ts", pathToFileURL(join(here, "role.ts")).href)
      .replaceAll("../lib/villas.ts", pathToFileURL(join(here, "villas.ts")).href);
    const js = ts.transpileModule(source, {
      fileName: "butler-villa-card.tsx",
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    writeFileSync(join(outDir, "card.js"), js);
    const mod = await import(pathToFileURL(join(outDir, "card.js")).href);
    return renderToStaticMarkup(createElement(mod[name], props));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

describe("two-axis butler board", () => {
  const world = seedFromPilot(NOW);
  const today = todayIct(NOW);
  const scope = PILOT_SEED.butlers.find((person) => person.id === "butler-chi")?.villaIds ?? [];
  assert.equal(today, TODAY);

  it("a turnover day is one card with both events", () => {
    const layout = dayLayout(world, today, scope, today, FLAGS);
    const card = findCard(layout, "t06");
    assert.ok(card);
    assert.deepEqual(
      card.events.map((event) => event.mark),
      ["departure", "arrival"],
    );
    assert.equal(cardOrder(layout).filter((id) => id === "t06").length, 1);
  });

  it("an incident stays above every non-incident card", () => {
    const withIncident = structuredClone(world) as World;
    withIncident.incidents.push({
      id: "inc-evening",
      stayId: "stay-late",
      villaId: "t03",
      note: "Vỡ kính",
      hasPhoto: false,
      createdAt: NOW,
      createdBy: "BUTLER",
    });
    const layout = dayLayout(withIncident, today, scope, today, FLAGS);
    const order = cardOrder(layout);
    const pinned = new Set(layout.pinned.map((card) => card.villaId));
    const firstPlain = order.findIndex((id) => !pinned.has(id));
    assert.ok(pinned.has("t03"));
    assert.equal(layout.pinned.find((card) => card.villaId === "t03")?.housekeeping, "blocked");
    assert.equal(firstPlain, layout.pinned.length);
    assert.ok(order.indexOf("t03") < firstPlain);
  });

  it("marking a villa ready does not move it", () => {
    const before = dayLayout(world, today, scope, today, FLAGS);
    const prepared = structuredClone(world) as World;
    prepared.villaReadiness = [
      {
        villaId: "t06",
        state: "READY",
        since: NOW,
        actorPersona: "BUTLER",
        actorId: "butler-chi",
        cause: "COMPLETE_CLEANING",
      },
    ];
    const after = dayLayout(prepared, today, scope, today, FLAGS);
    assert.deepEqual(cardOrder(before), cardOrder(after));
    assert.equal(findCard(before, "t06")?.readiness, "DIRTY");
    assert.equal(findCard(after, "t06")?.readiness, "READY");
    assert.equal(findCard(before, "t06")?.housekeeping, "needs-prep");
    assert.equal(findCard(after, "t06")?.housekeeping, "ready");
    assert.equal(findCard(before, "t06")?.window, findCard(after, "t06")?.window);
  });

  it("the week strip carries a workload count for each of the next 7 days", () => {
    const days = weekDays(world, today, scope, FLAGS);
    assert.equal(days.length, 7);
    assert.equal(days[0]?.date, today);
    assert.equal(days[0]?.isToday, true);
    assert.ok(days.every((day) => Number.isInteger(day.count) && day.count >= 0));
    assert.ok(days.some((day) => day.count > 0));
  });

  it("the primary button has an icon and a token color, never color alone", async () => {
    const card = findCard(dayLayout(world, today, scope, today, FLAGS), "t06");
    assert.ok(card);
    const html = await render("VillaDayCard", {
      card,
      stays: world.stays,
      role: { persona: "BUTLER", butlerId: "butler-chi", villaIds: scope },
      onOpen: () => undefined,
      onAction: () => undefined,
      onReport: () => undefined,
    });
    assert.match(html, /data-events="departure arrival"/);
    assert.match(html, /data-readiness="DIRTY"/);
    assert.match(html, /data-action-tone="moss"/);
    assert.match(html, /data-next-action="begin-cleaning"/);
    assert.match(html, /bg-moss/);
    assert.match(html, /Bắt đầu dọn/);
    assert.match(html, /Cần dọn/);
    assert.doesNotMatch(html, /Đang dọn/);
    assert.match(html, /<svg/);
    assert.match(html, /h-12/);
    assert.doesNotMatch(html, /#[0-9a-fA-F]{3,8}/);

    const days = weekDays(world, today, scope, FLAGS);
    const strip = await render("WeekStrip", {
      days,
      viewed: today,
      onView: () => undefined,
    });
    assert.equal(strip.match(/data-workload=/g)?.length, 7);
    assert.match(strip, /data-today="true"/);

    const bql = await render("VillaDayCard", {
      card,
      stays: world.stays,
      role: { persona: "BQL" },
      onOpen: () => undefined,
      onAction: () => undefined,
      onReport: () => undefined,
    });
    assert.match(bql, /Khách chính · <\/span>Khách/);
    assert.doesNotMatch(bql, /Chị Hà/);
    assert.doesNotMatch(bql, /Anh Long/);
  });

  it("CLEANING is a different chip and verb from not-yet-started", async () => {
    const cleaningWorld = structuredClone(world) as World;
    cleaningWorld.villaReadiness = [
      {
        villaId: "t06",
        state: "CLEANING",
        since: NOW,
        actorPersona: "BUTLER",
        actorId: "butler-chi",
        cause: "BEGIN_CLEANING",
      },
    ];
    const card = findCard(dayLayout(cleaningWorld, today, scope, today, FLAGS), "t06");
    assert.ok(card);
    assert.equal(card.readiness, "CLEANING");
    assert.equal(card.housekeeping, "needs-prep");
    const html = await render("VillaDayCard", {
      card,
      stays: cleaningWorld.stays,
      role: { persona: "BUTLER", butlerId: "butler-chi", villaIds: scope },
      onOpen: () => undefined,
      onAction: () => undefined,
      onReport: () => undefined,
    });
    assert.match(html, /data-readiness="CLEANING"/);
    assert.match(html, /data-readiness-label="CLEANING"/);
    assert.match(html, /Đang dọn/);
    assert.match(html, /Dọn xong/);
    assert.match(html, /data-next-action="complete-cleaning"/);
    assert.doesNotMatch(html, /Cần dọn/);
    assert.doesNotMatch(html, /Bắt đầu dọn/);
  });
});

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { nextCardAction } from "./butler-card.ts";
import { butlerFieldBoard } from "./domain/engine.ts";
import { PILOT_SEED } from "./pilot-data.ts";
import { visibleGuestName } from "./privacy.ts";
import { seedFromPilot } from "./seed-pilot.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript") as typeof import("typescript");

const NOW = "2026-09-24T02:00:00.000Z";

function todayIct(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

const butler = { persona: "BUTLER" as const, butlerId: "butler-chi", villaIds: [] as string[] };
const bql = { persona: "BQL" as const };

async function renderCard(props: Record<string, unknown>): Promise<string> {
  const here = filePath(new URL(".", import.meta.url));
  const outDir = mkdtempSync(join(here, ".butler-card-"));
  try {
    const source = readFileSync(new URL("../components/butler-stay-card.tsx", import.meta.url), "utf8")
      .replaceAll("../lib/butler-card.ts", pathToFileURL(join(here, "butler-card.ts")).href)
      .replaceAll("../lib/privacy.ts", pathToFileURL(join(here, "privacy.ts")).href)
      .replaceAll("../lib/villas.ts", pathToFileURL(join(here, "villas.ts")).href);
    const js = ts.transpileModule(source, {
      fileName: "butler-stay-card.tsx",
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    writeFileSync(join(outDir, "card.js"), js);
    const mod = await import(pathToFileURL(join(outDir, "card.js")).href);
    return renderToStaticMarkup(createElement(mod.ButlerStayCard, props));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

function filePath(url: URL): string {
  return url.pathname;
}

describe("butler today cards", () => {
  const world = seedFromPilot(NOW);
  const today = todayIct(NOW);
  const chi = PILOT_SEED.butlers.find((person) => person.id === "butler-chi");
  const board = butlerFieldBoard(world, today, chi?.villaIds ?? []);
  const arriving = board.arriving.find((stay) => stay.villaId === "t01");
  const preparing = board.prepare.find((stay) => stay.villaId === "t01");
  const leaving = board.departing.find((stay) => stay.villaId === "t06");

  it("seed guest names are people, not scenario labels", () => {
    for (const record of [...world.stays, ...world.requests, ...world.bookings]) {
      assert.equal(record.guestName.startsWith("Khách "), false, record.guestName);
    }
    assert.equal(arriving?.guestName, "Chị Mai");
    assert.equal(leaving?.guestName, "Anh Long");
  });

  it("an assigned Butler sees the lead guest; BQL still sees Khách", () => {
    assert.ok(preparing);
    assert.equal(visibleGuestName(preparing, butler), "Chị Mai");
    assert.equal(visibleGuestName(preparing, bql), "Khách");
    assert.equal(visibleGuestName(leaving!, butler), "Anh Long");
    assert.equal(visibleGuestName(leaving!, bql), "Khách");
  });

  it("each today card shows the next action on the card, not behind a link", async () => {
    assert.ok(preparing && arriving && leaving);
    const prepareHtml = await renderCard({
      stay: preparing,
      role: butler,
      lane: "prepare",
      canAct: true,
      onOpen: () => undefined,
      onAction: () => undefined,
    });
    const arriveHtml = await renderCard({
      stay: arriving,
      role: butler,
      lane: "arriving",
      canAct: true,
      onOpen: () => undefined,
      onAction: () => undefined,
    });
    const leaveHtml = await renderCard({
      stay: leaving,
      role: butler,
      lane: "departing",
      canAct: true,
      onOpen: () => undefined,
      onAction: () => undefined,
    });
    const bqlHtml = await renderCard({
      stay: arriving,
      role: bql,
      lane: "arriving",
      canAct: false,
      onOpen: () => undefined,
      onAction: () => undefined,
    });

    assert.match(prepareHtml, /Villa T01/);
    assert.match(prepareHtml, /t01/);
    assert.match(prepareHtml, /4 khách/);
    assert.match(prepareHtml, /Ngày đến/);
    assert.match(prepareHtml, /Chị Mai/);
    assert.doesNotMatch(prepareHtml, /data-next-action="prepare"/);
    assert.doesNotMatch(prepareHtml, /Đánh dấu đã chuẩn bị/);
    assert.doesNotMatch(prepareHtml, /<a /);

    assert.match(arriveHtml, /data-next-action="observe-arrival"/);
    assert.match(arriveHtml, /Ghi nhận khách đến/);
    assert.equal(nextCardAction({ ...arriving, arrivalObservedAt: NOW }, "arriving")?.label, "Nhận phòng");

    assert.match(leaveHtml, /Ngày đi/);
    assert.match(leaveHtml, /Anh Long/);
    assert.match(leaveHtml, /data-next-action="observe-departure"/);
    assert.match(leaveHtml, /Ghi nhận khách đi/);
    assert.doesNotMatch(leaveHtml, /<a /);

    assert.match(bqlHtml, /Khách chính · <\/span>Khách/);
    assert.doesNotMatch(bqlHtml, /Chị Mai/);
    assert.doesNotMatch(bqlHtml, /data-next-action/);
  });
});

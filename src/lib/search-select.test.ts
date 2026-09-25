import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DESTINATION_NAME } from "./pilot-data.ts";
import {
  PICKER_PAGE_SIZE,
  accountPickerItems,
  distinctDestinationNames,
  filterPickerItems,
  isExplicitMiss,
  pickerWindow,
  removePickerSelection,
  togglePickerSelection,
  villaPickerItems,
  type PickerItem,
} from "./search-select.ts";
import { villas } from "./villas.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript") as typeof import("typescript");

const DESTINATIONS = ["Oceanami", "Đồi Muối", "Sông Cạn"] as const;

function syntheticVillas(count = 300): PickerItem[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    const destination = DESTINATIONS[index % DESTINATIONS.length]!;
    return {
      id: `v${number}`,
      name: `Nhà ${number}`,
      detail: `v${number}`,
      group: destination,
    };
  });
}

async function renderPicker(props: Record<string, unknown>): Promise<string> {
  const outDir = mkdtempSync(join(filePath(new URL(".", import.meta.url)), ".picker-render-"));
  try {
    const logic = readFileSync(new URL("./search-select.ts", import.meta.url), "utf8");
    const view = readFileSync(new URL("../components/search-select.tsx", import.meta.url), "utf8").replace(
      "../lib/search-select.ts",
      "./search-select.js",
    );
    writeFileSync(join(outDir, "search-select.js"), transpile(logic, false));
    writeFileSync(join(outDir, "view.js"), transpile(view, true));
    const mod = await import(pathToFileURL(join(outDir, "view.js")).href);
    return renderToStaticMarkup(createElement(mod.SearchSelect, props));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

function filePath(url: URL): string {
  return url.pathname;
}

function transpile(source: string, jsx: boolean): string {
  return ts.transpileModule(source, {
    fileName: jsx ? "view.tsx" : "logic.ts",
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: jsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
    },
  }).outputText;
}

function checkboxCount(html: string): number {
  return html.match(/type="checkbox"/g)?.length ?? 0;
}

describe("searchable picker", () => {
  const catalogue = syntheticVillas();

  it("filters by name and by id", () => {
    assert.deepEqual(
      filterPickerItems(catalogue, "Nhà 012").map((item) => item.id),
      ["v012"],
    );
    assert.deepEqual(
      filterPickerItems(catalogue, "V299").map((item) => item.id),
      ["v299"],
    );
    const accounts = accountPickerItems([
      { name: "Lan Kiểm", email: "lan@example.com" },
      { name: "Minh", email: "minh@example.com" },
    ]);
    assert.deepEqual(
      filterPickerItems(accounts, "lan").map((item) => item.id),
      ["lan@example.com"],
    );
    assert.deepEqual(
      filterPickerItems(accounts, "MINH@example.com").map((item) => item.id),
      ["minh@example.com"],
    );
  });

  it("selects one item inside a destination and leaves the others alone", () => {
    const oceanami = catalogue.filter((item) => item.group === "Oceanami");
    const elsewhere = catalogue.filter((item) => item.group !== "Oceanami");
    const selected = togglePickerSelection([], oceanami[0]!.id, true);
    assert.deepEqual(selected, [oceanami[0]!.id]);
    assert.equal(
      oceanami.slice(1).some((item) => selected.includes(item.id)),
      false,
    );
    assert.equal(
      elsewhere.some((item) => selected.includes(item.id)),
      false,
    );
    const windowed = pickerWindow(
      filterPickerItems(catalogue, "Nhà 00"),
      PICKER_PAGE_SIZE,
    );
    assert.deepEqual(distinctDestinationNames(filterPickerItems(catalogue, "Nhà 00")), [
      "Oceanami",
      "Đồi Muối",
      "Sông Cạn",
    ]);
    assert.deepEqual(
      windowed.rows.filter((row) => row.kind === "heading").map((row) => row.label),
      ["Oceanami", "Đồi Muối", "Sông Cạn"],
    );
  });

  it("removes a chip without dropping the rest of the selection", () => {
    const selected = togglePickerSelection(
      togglePickerSelection([], "v001", true),
      "v004",
      true,
    );
    assert.deepEqual(removePickerSelection(selected, "v001"), ["v004"]);
  });

  it("paints a window of a 300-villa fixture, not every checkbox", async () => {
    assert.equal(catalogue.length, 300);
    assert.deepEqual(distinctDestinationNames(catalogue), ["Oceanami", "Đồi Muối", "Sông Cạn"]);
    const open = pickerWindow(catalogue, PICKER_PAGE_SIZE);
    assert.equal(open.rows.filter((row) => row.kind === "item").length, PICKER_PAGE_SIZE);
    assert.equal(open.hidden, 260);
    const html = await renderPicker({
      label: "Villa",
      items: catalogue,
      selectedIds: ["v001"],
      onChange: () => undefined,
      multiple: true,
    });
    assert.equal(checkboxCount(html), PICKER_PAGE_SIZE);
    assert.match(html, /Bỏ Nhà 001/);
    assert.equal(html.includes("v300"), false);
    assert.match(html, /Xem thêm/);
    const afterChip = await renderPicker({
      label: "Villa",
      items: catalogue,
      selectedIds: removePickerSelection(["v001"], "v001"),
      onChange: () => undefined,
      multiple: true,
    });
    assert.equal(afterChip.includes("Bỏ Nhà 001"), false);
  });

  it("says Không tìm thấy for a typed miss on villas and on accounts", async () => {
    assert.equal(isExplicitMiss("", 0), false);
    assert.equal(isExplicitMiss("   ", 0), false);
    assert.equal(isExplicitMiss("zzz", 0), true);
    const villasHtml = await renderPicker({
      label: "Villa",
      items: catalogue,
      selectedIds: [],
      onChange: () => undefined,
      query: "không-có-villa",
    });
    assert.match(villasHtml, /Không tìm thấy/);
    assert.equal(checkboxCount(villasHtml), 0);
    const accounts = accountPickerItems([
      { name: "Lan Kiểm", email: "lan@example.com" },
    ]);
    const accountsHtml = await renderPicker({
      label: "Tài khoản",
      items: accounts,
      selectedIds: [],
      onChange: () => undefined,
      multiple: false,
      query: "không-co@example.com",
    });
    assert.match(accountsHtml, /Không tìm thấy/);
    assert.equal(checkboxCount(accountsHtml), 0);
  });

  it("omits a destination heading when the seed has only Oceanami", () => {
    const live = villaPickerItems(villas, DESTINATION_NAME);
    assert.equal(live.length, 12);
    assert.equal(DESTINATION_NAME, "Oceanami");
    assert.equal(
      live.every((item) => item.group === "Oceanami"),
      true,
    );
    const windowed = pickerWindow(live, PICKER_PAGE_SIZE);
    assert.equal(
      windowed.rows.some((row) => row.kind === "heading"),
      false,
    );
    assert.equal(windowed.hidden, 0);
  });
});

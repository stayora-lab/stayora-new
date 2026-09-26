import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { showDemoPersonaSwitch } from "./site-header.ts";

function source(): string {
  return readFileSync(new URL("../components/site-chrome.tsx", import.meta.url), "utf8");
}

describe("mobile header", () => {
  it("shows the demo persona picker only with demo mode and no signed-in account", () => {
    assert.equal(showDemoPersonaSwitch(false, false), false);
    assert.equal(showDemoPersonaSwitch(false, true), false);
    assert.equal(showDemoPersonaSwitch(true, true), false);
    assert.equal(showDemoPersonaSwitch(true, false), true);
    const page = source();
    assert.match(page, /showDemoPersonaSwitch\(demoMode, Boolean\(identity\)\)/);
    assert.match(page, /data-persona-switch/);
  });

  it("is one row: mark on mobile, lockup and district on desktop, no clock in the mobile bar", () => {
    const page = source();
    const row = page.slice(page.indexOf("data-header-row"), page.indexOf("</header>"));
    assert.match(row, /flex-nowrap/);
    assert.equal(row.includes("flex-wrap"), false);
    assert.equal(row.includes("flex-col"), false);
    assert.match(page, /StayoraIcon className="size-8 object-contain md:hidden"/);
    assert.match(page, /StayoraLockup className="hidden md:block"/);
    assert.match(page, /data-destination[\s\S]*hidden[\s\S]*md:inline-flex/);
    assert.match(page, /Oceanami · Phước Hải/);
    assert.match(page, /data-account-menu/);
    assert.match(page, /className="relative md:hidden"/);
    assert.match(page, /hidden h-9 items-center[\s\S]*md:inline-flex/);
    const stamp = page.indexOf("Cập nhật lúc");
    const mobileStamp = page.indexOf('className="text-xs text-muted md:hidden"');
    assert.ok(stamp > 0);
    assert.equal(mobileStamp, -1);
    const stampBlock = page.slice(Math.max(0, stamp - 180), stamp);
    assert.match(stampBlock, /hidden min-w-0 md:block/);
    assert.match(page, /Bản thử nghiệm — không có giao dịch thật\./);
  });
});

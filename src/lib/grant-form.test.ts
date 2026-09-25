import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { grantReview } from "./grant-form.ts";

describe("role grant confirmation", () => {
  it("does not assume a role, and will not summarise a grant until one is chosen", () => {
    const page = readFileSync(new URL("../routes/admin_.roles.tsx", import.meta.url), "utf8");
    const form = readFileSync(new URL("./grant-form.ts", import.meta.url), "utf8");
    assert.match(page, /useState<GrantRoleId \| null>\(null\)/);
    assert.equal(/useState[^\n]*["']HOST["']/.test(page), false);
    assert.match(page, /type="radio"/);
    assert.match(page, /GRANT_ROLES\.map/);
    assert.match(form, /Chủ nhà/);
    assert.match(form, /Quản gia/);
    assert.match(form, /Sale/);
    assert.match(form, /BQL/);
    assert.match(page, /selectedAsChipsOnly/);
    assert.match(page, /data-grant-review/);
    assert.match(page, /Xác nhận cấp/);
    assert.equal(page.includes(">Cấp vai trò<"), false);
    assert.equal(grantReview({ role: null, accountLabel: "Hiền", villaLabels: ["Villa T01 (t01)"] }).ready, false);
    const missing = grantReview({ role: null, accountLabel: "Hiền", villaLabels: ["Villa T01 (t01)"] });
    assert.equal(missing.ready, false);
    if (!missing.ready) assert.equal(missing.reason, "Chọn một vai trò");
  });

  it("names the role and each villa before anything is written", () => {
    const review = grantReview({
      role: "BUTLER",
      accountLabel: "Nguyễn Thị Hiền",
      villaLabels: ["Villa T01 (t01)", "Villa T06 (t06)"],
    });
    assert.equal(review.ready, true);
    if (review.ready) {
      assert.match(review.title, /Quản gia/);
      assert.match(review.title, /Nguyễn Thị Hiền/);
      assert.match(review.detail, /t01/);
      assert.match(review.detail, /t06/);
      assert.match(review.detail, /một vai riêng/);
    }
    const host = grantReview({ role: "HOST", accountLabel: "Hiền", villaLabels: [] });
    assert.equal(host.ready, false);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seedFromPilot } from "./seed-pilot.ts";
import { emptyRoleHint, roleItemCount } from "./role-hint.ts";
import { villas } from "./villas.ts";

const NOW = "2026-09-24T02:00:00.000Z";

function todayIct(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

describe("empty role hint", () => {
  const world = seedFromPilot(NOW);
  const today = todayIct(NOW);
  const known = villas.map((villa) => villa.id);
  const quiet = known.find((id) => roleItemCount(world, "HOST", [id], [], today) === 0);
  const busy = known.find((id) => roleItemCount(world, "BUTLER", [id], [], today) > 0);

  it("points at the other role only when this one has nothing today", () => {
    assert.ok(quiet, "expected a villa with nothing today");
    assert.ok(busy, "expected a villa with butler work today");
    const grants = [
      { id: "host-quiet", role: "HOST", scopeRef: quiet!, status: "active" as const },
      { id: "butler-busy", role: "BUTLER", scopeRef: busy!, status: "active" as const },
    ];
    const hinted = emptyRoleHint({
      grants,
      current: "HOST",
      world,
      today,
      knownVillaIds: known,
    });
    assert.deepEqual(hinted, [{ role: "BUTLER", label: "Quản gia", grantId: "butler-busy" }]);
    assert.equal(
      emptyRoleHint({ grants, current: "BUTLER", world, today, knownVillaIds: known }),
      null,
    );
  });

  it("stays quiet for a single role, even when that role is empty today", () => {
    assert.ok(quiet);
    assert.equal(
      emptyRoleHint({
        grants: [{ id: "only", role: "HOST", scopeRef: quiet!, status: "active" }],
        current: "HOST",
        world,
        today,
        knownVillaIds: known,
      }),
      null,
    );
  });
});

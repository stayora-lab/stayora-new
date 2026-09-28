import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { HOST_ACTIONS_BEYOND_STANDARD_SET } from "./host-capability-config.ts";
import { HOST_ACTIONS_BEYOND_STANDARD_SET as exportedFromSurface } from "./host-surface.ts";
import {
  OCEANAMI_DESTINATION_ID,
  PENDING_UNIT_COPY,
  PrimaryOccupiedError,
  applicantRequestsFrom,
} from "./hosting-model.ts";
import {
  activePrimaryFor,
  createHostingRequest,
  decideHostingUnit,
  endHostingRelationship,
  establishPrimaryHost,
  ensureCataloguePrimaries,
  grantVillaScopedHost,
  grantsForIdentity,
  listApplicantHostingRequests,
  type Queryable,
} from "./hosting.ts";
import { isPublishedVilla, publishedVillas } from "./villas.ts";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

async function database(): Promise<PGlite> {
  const pg = new PGlite();
  await pg.waitReady;
  const root = new URL("../../migrations/", import.meta.url);
  for (const name of ["0003_role_grants.sql", "0005_hosting_relationship.sql"]) {
    await pg.exec(readFileSync(new URL(name, root), "utf8"));
  }
  return pg;
}

function queryable(pg: { query: PGlite["query"] }): Queryable {
  return {
    query: async <T>(text: string, params?: unknown[]) => {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
  };
}

async function unitId(
  pg: PGlite,
  requestId: string,
  villaId: string,
): Promise<string> {
  const rows = await pg.query<{ id: string }>(
    `select id from hosting_request_units where request_id = $1 and unit_id = $2`,
    [requestId, villaId],
  );
  const id = rows.rows[0]?.id;
  assert.ok(id);
  return id;
}

describe("hosting relationship requests", () => {
  it("creates one pending unit each and grants nothing until a decision", async () => {
    const pg = await database();
    const db = queryable(pg);
    const created = await createHostingRequest(db, {
      applicantUserId: "usr_lan",
      unitIds: ["t13", "t14", "t13"],
      contactName: "Khách Thử Làn",
      contactEmail: "lan.thu@example.com",
      contactPhone: "0900000101",
    });
    assert.deepEqual(created.unitIds, ["t13", "t14"]);
    const units = await pg.query<{ status: string; destination_id: string }>(
      `select u.status, r.destination_id
       from hosting_request_units u
       join hosting_requests r on r.id = u.request_id
       where r.id = $1
       order by u.unit_id`,
      [created.requestId],
    );
    assert.deepEqual(
      units.rows.map((row) => row.status),
      ["PENDING", "PENDING"],
    );
    assert.equal(units.rows[0]?.destination_id, OCEANAMI_DESTINATION_ID);
    assert.deepEqual(await grantsForIdentity(db, "usr_lan"), []);
    const relations = await pg.query(
      `select id from hosting_relationships where identity_id = 'usr_lan'`,
    );
    assert.equal(relations.rows.length, 0);

    const rejected = await unitId(pg, created.requestId, "t14");
    await pg.transaction(async (tx) => {
      await decideHostingUnit(queryable(tx), {
        unitRowId: rejected,
        outcome: "REJECTED",
        reason: "Không khớp vận hành",
      });
    });
    assert.deepEqual(await grantsForIdentity(db, "usr_lan"), []);
    const after = await pg.query<{ status: string }>(
      `select status from hosting_request_units where id = $1`,
      [rejected],
    );
    assert.equal(after.rows[0]?.status, "REJECTED");
  });

  it("approves an unclaimed unit into one relationship and one HOST grant", async () => {
    const pg = await database();
    const created = await createHostingRequest(queryable(pg), {
      applicantUserId: "usr_lan",
      unitIds: ["t13"],
      contactName: "Khách Thử Làn",
      contactEmail: "lan.thu@example.com",
      contactPhone: "0900000101",
    });
    const row = await unitId(pg, created.requestId, "t13");
    await pg.transaction(async (tx) => {
      await decideHostingUnit(queryable(tx), {
        unitRowId: row,
        outcome: "APPROVED",
        reason: "Đã xác minh vận hành",
      });
    });
    const relations = await pg.query<{ kind: string; identity_id: string }>(
      `select kind, identity_id from hosting_relationships
       where unit_id = 't13' and valid_to is null`,
    );
    assert.equal(relations.rows.length, 1);
    assert.equal(relations.rows[0]?.kind, "PRIMARY");
    assert.equal(relations.rows[0]?.identity_id, "usr_lan");
    const grants = await grantsForIdentity(queryable(pg), "usr_lan");
    assert.deepEqual(grants, [{ role: "HOST", scopeRef: "t13", status: "active" }]);
    const audit = await pg.query<{ actor: string; basis: string }>(
      `select actor, basis from hosting_request_units where id = $1`,
      [row],
    );
    assert.equal(audit.rows[0]?.actor, "Stayora vận hành (admin key)");
    assert.equal(audit.rows[0]?.basis, "Admin-assisted");
  });

  it("refuses approval when the unit already has a Primary and leaves it pending", async () => {
    const pg = await database();
    const created = await createHostingRequest(queryable(pg), {
      applicantUserId: "usr_lan",
      unitIds: ["t01"],
      contactName: "Khách Thử Làn",
      contactEmail: "lan.thu@example.com",
      contactPhone: "0900000101",
    });
    const row = await unitId(pg, created.requestId, "t01");
    await ensureCataloguePrimaries(queryable(pg));
    await assert.rejects(
      () =>
        pg.transaction(async (tx) => {
          await decideHostingUnit(queryable(tx), {
            unitRowId: row,
            outcome: "APPROVED",
            reason: "Thử nhận villa đã có chủ",
          });
        }),
      (err: unknown) => err instanceof PrimaryOccupiedError && /chủ nhà chính/.test(err.message),
    );
    const status = await pg.query<{ status: string }>(
      `select status from hosting_request_units where id = $1`,
      [row],
    );
    assert.equal(status.rows[0]?.status, "PENDING");
    assert.deepEqual(await grantsForIdentity(queryable(pg), "usr_lan"), []);
    const primary = await activePrimaryFor(queryable(pg), "t01");
    assert.equal(primary?.identityId, "host-an");
  });

  it("allows partial approval of a multi-unit request", async () => {
    const pg = await database();
    const created = await createHostingRequest(queryable(pg), {
      applicantUserId: "usr_lan",
      unitIds: ["t13", "t14", "t01"],
      contactName: "Khách Thử Làn",
      contactEmail: "lan.thu@example.com",
      contactPhone: "0900000101",
    });
    const t13 = await unitId(pg, created.requestId, "t13");
    const t14 = await unitId(pg, created.requestId, "t14");
    const t01 = await unitId(pg, created.requestId, "t01");
    await ensureCataloguePrimaries(queryable(pg));
    await pg.transaction(async (tx) => {
      await decideHostingUnit(queryable(tx), {
        unitRowId: t13,
        outcome: "APPROVED",
        reason: "Khớp villa trống",
      });
    });
    await pg.transaction(async (tx) => {
      await decideHostingUnit(queryable(tx), {
        unitRowId: t14,
        outcome: "REJECTED",
        reason: "Chưa đủ căn cứ",
      });
    });
    await assert.rejects(
      () =>
        pg.transaction(async (tx) => {
          await decideHostingUnit(queryable(tx), {
            unitRowId: t01,
            outcome: "APPROVED",
            reason: "Không được",
          });
        }),
      PrimaryOccupiedError,
    );
    const statuses = await pg.query<{ unit_id: string; status: string }>(
      `select unit_id, status from hosting_request_units where request_id = $1 order by unit_id`,
      [created.requestId],
    );
    assert.deepEqual(
      statuses.rows.map((row) => [row.unit_id, row.status]),
      [
        ["t01", "PENDING"],
        ["t13", "APPROVED"],
        ["t14", "REJECTED"],
      ],
    );
    const grants = await grantsForIdentity(queryable(pg), "usr_lan");
    assert.deepEqual(grants, [{ role: "HOST", scopeRef: "t13", status: "active" }]);
  });

  it("creates a relationship when the admin form grants a villa-scoped HOST", async () => {
    const pg = await database();
    await ensureCataloguePrimaries(queryable(pg));
    await pg.transaction(async (tx) => {
      await grantVillaScopedHost(queryable(tx), {
        unitId: "t15",
        identityId: "usr_minh",
        grantedBy: "ADMIN_KEY",
      });
    });
    const primary = await activePrimaryFor(queryable(pg), "t15");
    assert.equal(primary?.identityId, "usr_minh");
    assert.deepEqual(await grantsForIdentity(queryable(pg), "usr_minh"), [
      { role: "HOST", scopeRef: "t15", status: "active" },
    ]);
    await assert.rejects(
      () =>
        pg.transaction(async (tx) => {
          await grantVillaScopedHost(queryable(tx), {
            unitId: "t01",
            identityId: "usr_minh",
            grantedBy: "ADMIN_KEY",
          });
        }),
      PrimaryOccupiedError,
    );
    assert.equal(
      (await grantsForIdentity(queryable(pg), "usr_minh")).some((grant) => grant.scopeRef === "t01"),
      false,
    );
  });

  it("ends the relationship and that person's HOST and HOST_DAMAGE grants for the villa", async () => {
    const pg = await database();
    const db = queryable(pg);
    let relationshipId = "";
    await pg.transaction(async (tx) => {
      const established = await establishPrimaryHost(queryable(tx), {
        unitId: "t13",
        identityId: "usr_lan",
        grantedBy: "Stayora vận hành (admin key)",
      });
      relationshipId = established.relationshipId;
      await establishPrimaryHost(queryable(tx), {
        unitId: "t15",
        identityId: "usr_lan",
        grantedBy: "Stayora vận hành (admin key)",
      });
    });
    await pg.query(
      `insert into role_grants (id, user_id, role, scope_ref, status, granted_by)
       values ('dmg_t13', 'usr_lan', 'HOST_DAMAGE', 't13', 'active', 'ADMIN_KEY'),
              ('legacy', 'usr_lan', 'HOST', 'host-an', 'active', 'seed')`,
    );
    await endHostingRelationship(db, {
      relationshipId,
      endedBy: "Stayora vận hành (admin key)",
    });
    const grants = await grantsForIdentity(db, "usr_lan");
    const active = grants.filter((grant) => grant.status === "active");
    assert.deepEqual(
      active.map((grant) => `${grant.role}:${grant.scopeRef}`).sort(),
      ["HOST:host-an", "HOST:t15"],
    );
    const ended = await pg.query<{ valid_to: string | null }>(
      `select valid_to from hosting_relationships where id = $1`,
      [relationshipId],
    );
    assert.ok(ended.rows[0]?.valid_to);
    const still = await activePrimaryFor(db, "t15");
    assert.equal(still?.identityId, "usr_lan");
  });

  it("lets exactly one of two simultaneous approvals become Primary", async () => {
    const pg = await database();
    const attempts = await Promise.allSettled([
      pg.transaction(async (tx) => {
        await establishPrimaryHost(queryable(tx), {
          unitId: "t13",
          identityId: "usr_a",
          grantedBy: "Stayora vận hành (admin key)",
        });
      }),
      pg.transaction(async (tx) => {
        await establishPrimaryHost(queryable(tx), {
          unitId: "t13",
          identityId: "usr_b",
          grantedBy: "Stayora vận hành (admin key)",
        });
      }),
    ]);
    const ok = attempts.filter((item) => item.status === "fulfilled");
    const failed = attempts.filter((item) => item.status === "rejected");
    assert.equal(ok.length, 1);
    assert.equal(failed.length, 1);
    assert.ok(failed[0]?.status === "rejected");
    assert.ok(failed[0].reason instanceof PrimaryOccupiedError || /chủ nhà chính|duplicate key|one_active_primary/.test(String(failed[0].reason)));
    const primaries = await pg.query(
      `select identity_id from hosting_relationships
       where unit_id = 't13' and kind = 'PRIMARY' and valid_to is null`,
    );
    assert.equal(primaries.rows.length, 1);
    const grants = await pg.query(
      `select user_id from role_grants where role = 'HOST' and scope_ref = 't13' and status = 'active'`,
    );
    assert.equal(grants.rows.length, 1);
  });

  it("shows an applicant only their own requests and hides contact details", async () => {
    const pg = await database();
    const db = queryable(pg);
    await createHostingRequest(db, {
      applicantUserId: "usr_lan",
      unitIds: ["t13"],
      contactName: "Khách Thử Làn",
      contactEmail: "lan.thu@example.com",
      contactPhone: "0900000101",
    });
    await createHostingRequest(db, {
      applicantUserId: "usr_minh",
      unitIds: ["t14"],
      contactName: "Khách Thử Minh",
      contactEmail: "minh.thu@example.com",
      contactPhone: "0900000102",
    });
    const mine = await listApplicantHostingRequests(db, "usr_lan");
    assert.equal(mine.length, 1);
    assert.deepEqual(
      mine[0]?.units.map((unit) => unit.unitId),
      ["t13"],
    );
    const packed = JSON.stringify(mine);
    assert.equal(packed.includes("0900000101"), false);
    assert.equal(packed.includes("0900000102"), false);
    assert.equal(packed.includes("minh.thu@example.com"), false);
    assert.equal(packed.includes("contactPhone"), false);
    const file = source("./hosting.ts");
    const applicantSql = file.slice(
      file.indexOf("export async function listApplicantHostingRequests"),
      file.indexOf("export async function listAdminHostingQueue"),
    );
    assert.equal(applicantSql.includes("contact_phone"), false);
    assert.equal(applicantSql.includes("contact_email"), false);
    const adminSql = file.slice(
      file.indexOf("export async function listAdminHostingQueue"),
      file.indexOf("export async function decideHostingUnit"),
    );
    assert.match(adminSql, /contact_phone/);
    const server = source("./hosting.server.ts");
    assert.match(server, /currentDevUser/);
    assert.match(server, /authorizeRole/);
    const projected = applicantRequestsFrom(
      [
        {
          requestId: "hreq_other",
          applicantUserId: "usr_minh",
          destinationId: OCEANAMI_DESTINATION_ID,
          createdAt: "2026-09-28T00:00:00.000Z",
          units: [{ id: "u", unitId: "t14", status: "PENDING", reason: null }],
        },
      ],
      "usr_lan",
    );
    assert.deepEqual(projected, []);
  });
});

describe("unpublished catalogue units", () => {
  it("keeps units without a host out of discovery, search, sale search and the direct URL", () => {
    const listed = publishedVillas().map((villa) => villa.id);
    assert.equal(listed.includes("t13"), false);
    assert.equal(listed.includes("t01"), true);
    assert.equal(listed.length, 12);
    assert.equal(isPublishedVilla({ id: "t13", published: false } as never), false);
    const home = source("../routes/index.tsx");
    const sale = source("../routes/sale.tsx");
    const direct = source("../routes/villas.$villaId.tsx");
    assert.match(home, /publishedVillas\(\)/);
    assert.match(sale, /publishedVillas\(\)/);
    assert.match(direct, /isPublishedVilla/);
    const menu = source("../components/site-chrome.tsx");
    assert.match(menu, /Trở thành chủ nhà/);
    assert.equal(menu.includes("Đang chờ Stayora xác nhận"), false);
    assert.match(source("../routes/hosting-requests.tsx"), /PENDING_UNIT_COPY/);
    assert.equal(PENDING_UNIT_COPY, "Đang chờ Stayora xác nhận");
    assert.match(source("../routes/host.tsx"), /data-host-cta/);
    assert.match(source("../routes/admin_.hosting.tsx"), /contactPhone/);
  });
});

describe("host actions outside the standard set", () => {
  it("labels each existing extra action as a prototype assumption", () => {
    assert.equal(exportedFromSurface, HOST_ACTIONS_BEYOND_STANDARD_SET);
    assert.ok(HOST_ACTIONS_BEYOND_STANDARD_SET.length >= 6);
    for (const action of HOST_ACTIONS_BEYOND_STANDARD_SET) {
      assert.equal(action.assumption, "PROTOTYPE ASSUMPTION beyond the canonical standard set");
    }
    const ids = HOST_ACTIONS_BEYOND_STANDARD_SET.map((action) => action.id);
    for (const id of [
      "protective-hold-place",
      "protective-hold-release",
      "maintenance-from-hold",
      "maintenance-block",
      "payment-status-lines",
      "balance-due-lines",
      "report-incident",
    ]) {
      assert.ok(ids.includes(id as (typeof ids)[number]), id);
    }
    const grant = source("./grant-form.ts");
    assert.match(grant, /villa-scoped Host damage-resolution authority \(ADR-P073\)/);
  });
});

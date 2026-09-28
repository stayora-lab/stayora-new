import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { PrimaryOccupiedError } from "./hosting-model.ts";
import {
  activePrimaryFor,
  establishPrimaryHost,
  grantsForIdentity,
  type Queryable,
} from "./hosting.ts";
import {
  BASIS_ADMIN_EXCEPTION,
  BASIS_COHOST,
  BASIS_NORMAL_ACCEPTANCE,
  BASIS_TRANSFER_PENDING,
  COHOST_ROLE,
  acceptDesignation,
  adminReplacePrimary,
  auditBasisFor,
  cancelDesignation,
  cohostRemovalMatters,
  declineDesignation,
  designateSuccessor,
  inviteCohost,
  materializeCohostInvites,
  removeCohost,
} from "./hosting-transfer.ts";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

async function database(): Promise<PGlite> {
  const pg = new PGlite();
  await pg.waitReady;
  const root = new URL("../../migrations/", import.meta.url);
  for (const name of ["0003_role_grants.sql", "0005_hosting_relationship.sql", "0006_primary_transfer.sql"]) {
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

async function primary(pg: PGlite, unitId: string, identityId: string) {
  await establishPrimaryHost(queryable(pg), {
    unitId,
    identityId,
    grantedBy: "ADMIN_KEY",
  });
}

async function damage(pg: PGlite, unitId: string, identityId: string) {
  await pg.query(
    `insert into role_grants (id, user_id, role, scope_ref, status, granted_by, granted_at)
     values ($1, $2, 'HOST_DAMAGE', $3, 'active', 'ADMIN_KEY', now())`,
    [`dmg_${unitId}_${identityId}`, identityId, unitId],
  );
}

describe("primary transfer", () => {
  it("does not move authority when the current Primary designates a successor", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    await damage(pg, "t13", "usr_lan");
    await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_minh",
      recipientEmail: "minh@example.com",
      recipientName: "Minh",
    });
    assert.equal((await activePrimaryFor(db, "t13"))?.identityId, "usr_lan");
    const lan = await grantsForIdentity(db, "usr_lan");
    assert.deepEqual(
      lan.filter((grant) => grant.status === "active").map((grant) => grant.role).sort(),
      ["HOST", "HOST_DAMAGE"],
    );
    assert.deepEqual(await grantsForIdentity(db, "usr_minh"), []);
  });

  it("replaces the previous pending designation on the same unit", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_minh",
      recipientEmail: "minh@example.com",
      recipientName: "Minh",
    });
    await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_hoa",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    const rows = await pg.query<{ status: string; recipient_email: string }>(
      `select status, recipient_email from primary_designations where unit_id = 't13' order by status`,
    );
    assert.deepEqual(
      rows.rows.map((row) => `${row.status}:${row.recipient_email}`),
      ["PENDING:hoa@example.com", "REPLACED:minh@example.com"],
    );
    assert.equal((await activePrimaryFor(db, "t13"))?.identityId, "usr_lan");
  });

  it("leaves the Primary unchanged after decline or cancel and allows another designation", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    const first = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_minh",
      recipientEmail: "minh@example.com",
      recipientName: "Minh",
    });
    await declineDesignation(db, {
      designationId: first.designationId,
      actorId: "usr_minh",
      actorEmail: "minh@example.com",
    });
    const second = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_hoa",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    await cancelDesignation(db, { designationId: second.designationId, actorId: "usr_lan" });
    const third = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientEmail: "an@example.com",
      recipientName: "An",
    });
    assert.ok(third.designationId);
    assert.equal((await activePrimaryFor(db, "t13"))?.identityId, "usr_lan");
    const statuses = await pg.query<{ status: string }>(
      `select status from primary_designations where unit_id = 't13' order by created_at`,
    );
    assert.deepEqual(
      statuses.rows.map((row) => row.status),
      ["DECLINED", "CANCELLED", "PENDING"],
    );
  });

  it("accepts atomically, grants the standard set fresh, and keeps or drops Co-hosts", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    await damage(pg, "t13", "usr_lan");
    await pg.query(
      `insert into role_grants (id, user_id, role, scope_ref, status, granted_by, granted_at)
       values ('sale_lan', 'usr_lan', 'SALE', 'usr_lan', 'active', 'ADMIN_KEY', now())`,
    );
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_hoa",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_khoa",
      recipientEmail: "khoa@example.com",
      recipientName: "Khoa",
    });
    const designated = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_minh",
      recipientEmail: "minh@example.com",
      recipientName: "Minh",
    });
    await pg.transaction(async (tx) => {
      await acceptDesignation(queryable(tx), {
        designationId: designated.designationId,
        actorId: "usr_minh",
        actorEmail: "minh@example.com",
        removeCohostIds: ["usr_khoa"],
      });
    });
    const primaries = await pg.query<{ identity_id: string }>(
      `select identity_id from hosting_relationships
       where unit_id = 't13' and kind = 'PRIMARY' and valid_to is null`,
    );
    assert.deepEqual(primaries.rows.map((row) => row.identity_id), ["usr_minh"]);
    const minh = (await grantsForIdentity(db, "usr_minh")).filter((grant) => grant.status === "active");
    assert.deepEqual(minh.map((grant) => `${grant.role}:${grant.scopeRef}`), ["HOST:t13"]);
    const lan = (await grantsForIdentity(db, "usr_lan")).filter((grant) => grant.status === "active");
    assert.deepEqual(lan.map((grant) => grant.role), ["SALE"]);
    const hoa = (await grantsForIdentity(db, "usr_hoa")).filter((grant) => grant.status === "active");
    assert.deepEqual(hoa.map((grant) => `${grant.role}:${grant.scopeRef}`), [`${COHOST_ROLE}:t13`]);
    const hoaGrant = await pg.query<{ granted_by: string }>(
      `select granted_by from role_grants where user_id = 'usr_hoa' and role = 'COHOST' and status = 'active'`,
    );
    assert.equal(hoaGrant.rows[0]?.granted_by, "usr_minh");
    const khoa = (await grantsForIdentity(db, "usr_khoa")).filter((grant) => grant.status === "active");
    assert.equal(khoa.length, 0);
    const audit = await auditBasisFor(db, "t13");
    assert.equal(audit.some((row) => row.basis === BASIS_NORMAL_ACCEPTANCE && row.event === "acceptance"), true);
    assert.equal(audit.some((row) => row.event === "cohost-retain" && row.basis === BASIS_COHOST), true);
    assert.equal(audit.some((row) => row.event === "cohost-remove" && row.basis === BASIS_COHOST), true);
  });

  it("lets acceptance and another establish attempt leave exactly one Primary", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    const designated = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_minh",
      recipientEmail: "minh@example.com",
      recipientName: "Minh",
    });
    const attempts = await Promise.allSettled([
      pg.transaction(async (tx) => {
        await acceptDesignation(queryable(tx), {
          designationId: designated.designationId,
          actorId: "usr_minh",
          actorEmail: "minh@example.com",
        });
      }),
      pg.transaction(async (tx) => {
        await establishPrimaryHost(queryable(tx), {
          unitId: "t13",
          identityId: "usr_other",
          grantedBy: "ADMIN_KEY",
        });
      }),
    ]);
    const primaries = await pg.query<{ identity_id: string }>(
      `select identity_id from hosting_relationships
       where unit_id = 't13' and kind = 'PRIMARY' and valid_to is null`,
    );
    assert.equal(primaries.rows.length, 1);
    const failed = attempts.filter((item) => item.status === "rejected");
    assert.ok(failed.length >= 1);
    const reason = failed[0]?.status === "rejected" ? failed[0].reason : null;
    assert.ok(
      reason instanceof PrimaryOccupiedError ||
        /chủ nhà chính|duplicate key|one_active_primary|Không còn đề cử/.test(String(reason)),
    );
    assert.notEqual(primaries.rows[0]?.identity_id, "usr_lan");
  });

  it("refuses Co-host designation, invite, and removal", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_hoa",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    await assert.rejects(
      () =>
        designateSuccessor(db, {
          unitId: "t13",
          actorId: "usr_hoa",
          recipientIdentityId: "usr_minh",
          recipientEmail: "minh@example.com",
          recipientName: "Minh",
        }),
      /chủ nhà chính/,
    );
    await assert.rejects(
      () =>
        inviteCohost(db, {
          unitId: "t13",
          actorId: "usr_hoa",
          recipientIdentityId: "usr_khoa",
          recipientEmail: "khoa@example.com",
          recipientName: "Khoa",
        }),
      /chủ nhà chính/,
    );
    await assert.rejects(
      () => removeCohost(db, { unitId: "t13", actorId: "usr_hoa", cohostIdentityId: "usr_lan" }),
      /chủ nhà chính/,
    );
    const designated = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_minh",
      recipientEmail: "minh@example.com",
      recipientName: "Minh",
    });
    await assert.rejects(
      () =>
        acceptDesignation(db, {
          designationId: designated.designationId,
          actorId: "usr_hoa",
          actorEmail: "hoa@example.com",
        }),
      /người được đề cử/,
    );
    assert.equal((await activePrimaryFor(db, "t13"))?.identityId, "usr_lan");
  });

  it("replaces Primary by admin exception without a designation and keeps the distinct basis", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    await damage(pg, "t13", "usr_lan");
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_hoa",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    await pg.transaction(async (tx) => {
      await adminReplacePrimary(queryable(tx), {
        unitId: "t13",
        incomingIdentityId: "usr_minh",
        reason: "Chủ nhà chính không liên lạc được",
        actor: "Stayora vận hành (admin key)",
      });
    });
    assert.equal((await activePrimaryFor(db, "t13"))?.identityId, "usr_minh");
    const minh = (await grantsForIdentity(db, "usr_minh")).filter((grant) => grant.status === "active");
    assert.deepEqual(minh.map((grant) => grant.role), ["HOST"]);
    const lanDamage = (await grantsForIdentity(db, "usr_lan")).filter(
      (grant) => grant.status === "active" && grant.role === "HOST_DAMAGE",
    );
    assert.equal(lanDamage.length, 0);
    const hoa = await pg.query<{ granted_by: string }>(
      `select granted_by from role_grants
       where user_id = 'usr_hoa' and role = 'COHOST' and status = 'active'`,
    );
    assert.equal(hoa.rows[0]?.granted_by, "usr_minh");
    const audit = await auditBasisFor(db, "t13");
    const exception = audit.find((row) => row.event === "admin-replace");
    assert.equal(exception?.basis, BASIS_ADMIN_EXCEPTION);
    assert.match(exception?.detail ?? "", /không liên lạc/);
    const body = source("./hosting-transfer.ts");
    assert.equal(body.includes("insert into hosting_relationships"), false);
    assert.match(body, /establishPrimaryHost/);
    const pending = await pg.query(
      `select id from primary_designations where unit_id = 't13' and status = 'PENDING'`,
    );
    assert.equal(pending.rows.length, 0);
  });

  it("lists outstanding matters and still removes the Co-host", async () => {
    const matters = cohostRemovalMatters({
      unitId: "t07",
      today: "2026-09-29",
      requests: [
        {
          villaId: "t07",
          status: "ACCEPTED",
          guestName: "Chị Trang",
          checkIn: "2026-10-04",
          checkOut: "2026-10-06",
        },
        {
          villaId: "t01",
          status: "ACCEPTED",
          guestName: "Người khác",
          checkIn: "2026-10-01",
          checkOut: "2026-10-02",
        },
      ],
      stays: [
        {
          villaId: "t07",
          status: "SCHEDULED",
          guestName: "Anh Phong",
          checkIn: "2026-10-09",
          checkOut: "2026-10-12",
          assignedButlerId: "butler-an",
        },
      ],
    });
    assert.deepEqual(
      matters.map((item) => item.kind),
      ["accepted-request", "upcoming-stay", "butler-assignment"],
    );
    assert.equal(JSON.stringify(matters).includes("nightly"), false);
    assert.equal(JSON.stringify(matters).includes("Người khác"), false);
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_hoa",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    await removeCohost(db, { unitId: "t13", actorId: "usr_lan", cohostIdentityId: "usr_hoa" });
    const active = (await grantsForIdentity(db, "usr_hoa")).filter((grant) => grant.status === "active");
    assert.equal(active.length, 0);
    const audit = await auditBasisFor(db, "t13");
    assert.equal(audit.some((row) => row.event === "cohost-remove" && row.basis === BASIS_COHOST), true);
  });

  it("materializes an email Co-host invite only while the inviter is still Primary", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_lan");
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    assert.deepEqual(await grantsForIdentity(db, "usr_hoa"), []);
    await materializeCohostInvites(db, { identityId: "usr_hoa", email: "hoa@example.com" });
    const grants = (await grantsForIdentity(db, "usr_hoa")).filter((grant) => grant.status === "active");
    assert.deepEqual(grants.map((grant) => grant.role), [COHOST_ROLE]);
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientEmail: "late@example.com",
      recipientName: "Late",
    });
    const pending = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_lan",
      recipientIdentityId: "usr_minh",
      recipientEmail: "minh@example.com",
      recipientName: "Minh",
    });
    assert.equal(
      (await auditBasisFor(db, "t13")).some((row) => row.basis === BASIS_TRANSFER_PENDING),
      true,
    );
    await pg.transaction(async (tx) => {
      await acceptDesignation(queryable(tx), {
        designationId: pending.designationId,
        actorId: "usr_minh",
        actorEmail: "minh@example.com",
      });
    });
    const invites = await pg.query<{ recipient_email: string; status: string }>(
      `select recipient_email, status from cohost_invites where unit_id = 't13' order by recipient_email`,
    );
    assert.deepEqual(
      invites.rows.map((row) => `${row.recipient_email}:${row.status}`),
      ["hoa@example.com:GRANTED", "late@example.com:CANCELLED"],
    );
  });
});

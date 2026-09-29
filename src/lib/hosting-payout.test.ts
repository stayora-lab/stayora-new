import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { establishPrimaryHost, type Queryable } from "./hosting.ts";
import type { CohortBooking, CohortStay } from "./hosting-payout-model.ts";
import {
  classifyTransferCohort,
  primaryIdentityAt,
  resolvePayoutRecipient,
  setTransferPayoutChoice,
} from "./hosting-payout.ts";
import { BASIS_ADMIN_EXCEPTION, BASIS_NORMAL_ACCEPTANCE, BASIS_TRANSFER_PENDING } from "./hosting-transfer-model.ts";
import {
  acceptDesignation,
  adminReplacePrimary,
  auditBasisFor,
  designateSuccessor,
  inviteCohost,
  loadTransferDesk,
} from "./hosting-transfer.ts";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

async function database(): Promise<PGlite> {
  const pg = new PGlite();
  await pg.waitReady;
  const root = new URL("../../migrations/", import.meta.url);
  for (const name of [
    "0003_role_grants.sql",
    "0004_dev_identity.sql",
    "0005_hosting_relationship.sql",
    "0006_primary_transfer.sql",
    "0007_payout_recipient_instruction.sql",
  ]) {
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
  await establishPrimaryHost(queryable(pg), { unitId, identityId, grantedBy: "ADMIN_KEY" });
}

function booking(input: Partial<CohortBooking> & { id: string }): CohortBooking {
  return {
    villaId: "t13",
    reference: input.id,
    guestName: input.guestName ?? input.id,
    status: "CONFIRMED",
    confirmedAt: "2026-09-01T00:00:00.000Z",
    stayId: `sty_${input.id}`,
    checkIn: "2026-11-02",
    ...input,
  };
}

function stay(input: Partial<CohortStay> & { id: string }): CohortStay {
  return { villaId: "t13", status: "SCHEDULED", checkedInAt: null, ...input };
}

async function instructions(pg: PGlite) {
  const rows = await pg.query<{
    booking_id: string;
    retained_identity_id: string;
    direction: string;
    set_by: string;
    basis: string;
  }>(
    `select booking_id, retained_identity_id, direction, set_by, basis
     from payout_recipient_instructions order by booking_id`,
  );
  return rows.rows;
}

async function accept(
  pg: PGlite,
  input: {
    designationId: string;
    actorId: string;
    email: string;
    bookings: CohortBooking[];
    stays: CohortStay[];
    effectiveAt: string;
  },
) {
  await pg.transaction(async (tx) => {
    await acceptDesignation(queryable(tx), {
      designationId: input.designationId,
      actorId: input.actorId,
      actorEmail: input.email,
      bookings: input.bookings,
      stays: input.stays,
      effectiveAt: input.effectiveAt,
    });
  });
}

describe("transfer payout instruction", () => {
  it("follows the Primary at actual check-in when no override was recorded", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_p0");
    const designated = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p0",
      recipientIdentityId: "usr_p1",
      recipientEmail: "p1@example.com",
      recipientName: "P1",
    });
    const bookings = [booking({ id: "bkg_b", guestName: "B" })];
    const stays = [stay({ id: "sty_bkg_b" })];
    await accept(pg, {
      designationId: designated.designationId,
      actorId: "usr_p1",
      email: "p1@example.com",
      bookings,
      stays,
      effectiveAt: "2026-10-01T00:00:00.000Z",
    });
    assert.deepEqual(await instructions(pg), []);
    const covered = await pg.query<{ identity_id: string; valid_from: Date | string }>(
      `select identity_id, valid_from from hosting_relationships where unit_id = 't13' order by valid_from`,
    );
    const outgoing = covered.rows.find((row) => row.identity_id === "usr_p0");
    assert.ok(outgoing);
    const atOutgoing = await primaryIdentityAt(db, "t13", new Date(outgoing.valid_from).toISOString());
    assert.equal(atOutgoing, "usr_p0");
    const atIncoming = await primaryIdentityAt(db, "t13", "2027-01-01T00:00:00.000Z");
    assert.equal(atIncoming, "usr_p1");
    assert.deepEqual(resolvePayoutRecipient({ retainedIdentityId: null, primaryAtCheckIn: atIncoming }), {
      identityId: "usr_p1",
      source: "primary-at-check-in",
    });
  });

  it("retains the whole attributable cohort and does not write a per-booking choice", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_p0");
    await pg.query(
      `insert into payout_recipient_instructions (
         booking_id, unit_id, direction, retained_identity_id, transfer_ref, set_by, basis
       ) values ('bkg_held', 't13', 'RETAIN', 'usr_earlier', 'earlier', 'usr_earlier', 'normal-transfer-acceptance')`,
    );
    const designated = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p0",
      recipientIdentityId: "usr_p1",
      recipientEmail: "p1@example.com",
      recipientName: "P1",
    });
    await setTransferPayoutChoice(db, {
      designationId: designated.designationId,
      actorId: "usr_p0",
      choice: "RETAIN",
    });
    const pendingChoices = await pg.query<{ designation_id: string; choice: string }>(
      `select designation_id, choice from transfer_payout_choices`,
    );
    assert.deepEqual(pendingChoices.rows, [{ designation_id: designated.designationId, choice: "RETAIN" }]);
    assert.deepEqual(
      (await instructions(pg)).map((row) => row.booking_id),
      ["bkg_held"],
    );
    const bookings = [
      booking({ id: "bkg_b1", guestName: "Một" }),
      booking({ id: "bkg_b2", guestName: "Hai", checkIn: "2026-11-03" }),
      booking({ id: "bkg_cancel", status: "CANCELLED" }),
      booking({ id: "bkg_in", stayId: "sty_in" }),
      booking({ id: "bkg_late", confirmedAt: "2026-10-02T00:00:00.000Z" }),
      booking({ id: "bkg_other", villaId: "t01" }),
      booking({ id: "bkg_held", guestName: "Đã giữ" }),
      booking({ id: "bkg_never", stayId: "sty_never" }),
    ];
    const stays = [
      stay({ id: "sty_bkg_b1" }),
      stay({ id: "sty_bkg_b2" }),
      stay({ id: "sty_bkg_cancel" }),
      stay({ id: "sty_in", status: "CHECKED_IN", checkedInAt: "2026-08-01T00:00:00.000Z" }),
      stay({ id: "sty_bkg_late" }),
      stay({ id: "sty_bkg_other", villaId: "t01" }),
      stay({ id: "sty_bkg_held" }),
      stay({ id: "sty_never", status: "DID_NOT_OCCUR" }),
    ];
    await accept(pg, {
      designationId: designated.designationId,
      actorId: "usr_p1",
      email: "p1@example.com",
      bookings,
      stays,
      effectiveAt: "2026-10-01T00:00:00.000Z",
    });
    const rows = await instructions(pg);
    assert.deepEqual(
      rows.map((row) => `${row.booking_id}:${row.retained_identity_id}`),
      ["bkg_b1:usr_p0", "bkg_b2:usr_p0", "bkg_held:usr_earlier"],
    );
    assert.equal(rows.every((row) => row.direction === "RETAIN"), true);
    const body = source("./hosting-payout.ts");
    assert.equal(/update\s+payout_recipient_instructions/i.test(body), false);
    assert.equal(body.includes("retainBooking"), false);
    await assert.rejects(
      () =>
        setTransferPayoutChoice(db, {
          designationId: designated.designationId,
          actorId: "usr_p0",
          choice: "FOLLOW_INCOMING",
        }),
      /không còn chờ/,
    );
  });

  it("keeps P0's retain through P1 to P2 and lets P1 choose only the unretained booking", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_p0");
    const first = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p0",
      recipientIdentityId: "usr_p1",
      recipientEmail: "p1@example.com",
      recipientName: "P1",
    });
    await setTransferPayoutChoice(db, {
      designationId: first.designationId,
      actorId: "usr_p0",
      choice: "RETAIN",
    });
    const stays = [stay({ id: "sty_bkg_b" }), stay({ id: "sty_bkg_c" })];
    await accept(pg, {
      designationId: first.designationId,
      actorId: "usr_p1",
      email: "p1@example.com",
      bookings: [booking({ id: "bkg_b", guestName: "B" })],
      stays,
      effectiveAt: "2026-10-01T00:00:00.000Z",
    });
    const second = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p1",
      recipientIdentityId: "usr_p2",
      recipientEmail: "p2@example.com",
      recipientName: "P2",
    });
    const duringP1 = [
      booking({ id: "bkg_b", guestName: "B" }),
      booking({ id: "bkg_c", guestName: "C", confirmedAt: "2026-10-05T00:00:00.000Z" }),
    ];
    const preview = classifyTransferCohort({
      unitId: "t13",
      effectiveAt: "2026-10-20T00:00:00.000Z",
      bookings: duringP1,
      stays,
      retained: [{ bookingId: "bkg_b", retainedIdentityId: "usr_p0", retainedName: "P0" }],
    });
    assert.equal(preview.find((line) => line.bookingId === "bkg_b")?.kind, "retained-locked");
    assert.equal(preview.find((line) => line.bookingId === "bkg_c")?.kind, "attributable");
    await setTransferPayoutChoice(db, {
      designationId: second.designationId,
      actorId: "usr_p1",
      choice: "RETAIN",
    });
    await accept(pg, {
      designationId: second.designationId,
      actorId: "usr_p2",
      email: "p2@example.com",
      bookings: duringP1,
      stays,
      effectiveAt: "2026-10-20T00:00:00.000Z",
    });
    assert.deepEqual(
      (await instructions(pg)).map((row) => `${row.booking_id}:${row.retained_identity_id}`),
      ["bkg_b:usr_p0", "bkg_c:usr_p1"],
    );
    const atP2 = await primaryIdentityAt(db, "t13", "2027-01-01T00:00:00.000Z");
    assert.equal(atP2, "usr_p2");
    assert.equal(resolvePayoutRecipient({ retainedIdentityId: "usr_p0", primaryAtCheckIn: atP2 }).identityId, "usr_p0");
    assert.equal(resolvePayoutRecipient({ retainedIdentityId: null, primaryAtCheckIn: atP2 }).identityId, "usr_p2");
  });

  it("lets silence and follow-incoming write nothing and leaves an earlier retain in place", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_p0");
    const first = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p0",
      recipientIdentityId: "usr_p1",
      recipientEmail: "p1@example.com",
      recipientName: "P1",
    });
    await setTransferPayoutChoice(db, {
      designationId: first.designationId,
      actorId: "usr_p0",
      choice: "RETAIN",
    });
    await setTransferPayoutChoice(db, {
      designationId: first.designationId,
      actorId: "usr_p0",
      choice: "FOLLOW_INCOMING",
    });
    const bookings = [booking({ id: "bkg_b" })];
    const stays = [stay({ id: "sty_bkg_b" })];
    await accept(pg, {
      designationId: first.designationId,
      actorId: "usr_p1",
      email: "p1@example.com",
      bookings,
      stays,
      effectiveAt: "2026-10-01T00:00:00.000Z",
    });
    assert.deepEqual(await instructions(pg), []);
    const audit = await auditBasisFor(db, "t13");
    assert.equal(audit.some((row) => row.event === "payout-choice" && row.basis === BASIS_TRANSFER_PENDING), true);
    assert.equal(
      audit.some(
        (row) =>
          row.event === "payout-choice-binding" &&
          row.basis === BASIS_NORMAL_ACCEPTANCE &&
          row.detail?.includes("FOLLOW_INCOMING"),
      ),
      true,
    );
    await pg.query(
      `insert into payout_recipient_instructions (
         booking_id, unit_id, direction, retained_identity_id, transfer_ref, set_by, basis
       ) values ('bkg_b', 't13', 'RETAIN', 'usr_p0', 'kept', 'usr_p0', 'normal-transfer-acceptance')`,
    );
    const second = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p1",
      recipientIdentityId: "usr_p2",
      recipientEmail: "p2@example.com",
      recipientName: "P2",
    });
    await accept(pg, {
      designationId: second.designationId,
      actorId: "usr_p2",
      email: "p2@example.com",
      bookings,
      stays,
      effectiveAt: "2026-10-20T00:00:00.000Z",
    });
    assert.deepEqual(
      (await instructions(pg)).map((row) => `${row.booking_id}:${row.retained_identity_id}`),
      ["bkg_b:usr_p0"],
    );
  });

  it("refuses a Co-host both the desk view and the choice", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_p0");
    await inviteCohost(db, {
      unitId: "t13",
      actorId: "usr_p0",
      recipientIdentityId: "usr_hoa",
      recipientEmail: "hoa@example.com",
      recipientName: "Hoa",
    });
    const designated = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p0",
      recipientIdentityId: "usr_p1",
      recipientEmail: "p1@example.com",
      recipientName: "P1",
    });
    await assert.rejects(
      () =>
        setTransferPayoutChoice(db, {
          designationId: designated.designationId,
          actorId: "usr_hoa",
          choice: "RETAIN",
        }),
      /chủ nhà chính/,
    );
    const desk = await loadTransferDesk(db, {
      identityId: "usr_hoa",
      email: "hoa@example.com",
      bookings: [booking({ id: "bkg_b" })],
      stays: [stay({ id: "sty_bkg_b" })],
      now: "2026-10-01T00:00:00.000Z",
    });
    assert.deepEqual(desk.primaryUnits, []);
    assert.deepEqual(desk.incoming, []);
    const host = source("../routes/host.tsx");
    assert.equal(host.includes("data-payout"), false);
    assert.equal(host.includes("Giữ cả nhóm"), false);
    assert.deepEqual(await instructions(pg), []);
  });

  it("does not execute a payment or rewrite an instruction on the admin path", async () => {
    const pg = await database();
    const db = queryable(pg);
    await primary(pg, "t13", "usr_p0");
    const designated = await designateSuccessor(db, {
      unitId: "t13",
      actorId: "usr_p0",
      recipientIdentityId: "usr_p1",
      recipientEmail: "p1@example.com",
      recipientName: "P1",
    });
    await setTransferPayoutChoice(db, {
      designationId: designated.designationId,
      actorId: "usr_p0",
      choice: "RETAIN",
    });
    const bookings = [booking({ id: "bkg_b", guestName: "B" })];
    const stays = [stay({ id: "sty_bkg_b" })];
    await pg.transaction(async (tx) => {
      await adminReplacePrimary(queryable(tx), {
        unitId: "t13",
        incomingIdentityId: "usr_p2",
        reason: "Không liên lạc được",
        actor: "Stayora vận hành (admin key)",
        bookings,
        stays,
        effectiveAt: "2026-10-01T00:00:00.000Z",
      });
    });
    assert.deepEqual(await instructions(pg), []);
    await primary(pg, "t01", "usr_p0");
    await pg.transaction(async (tx) => {
      await adminReplacePrimary(queryable(tx), {
        unitId: "t01",
        incomingIdentityId: "usr_p1",
        reason: "Không liên lạc được",
        actor: "Stayora vận hành (admin key)",
        payoutChoice: "RETAIN",
        bookings: [booking({ id: "bkg_a", villaId: "t01", stayId: "sty_a" })],
        stays: [stay({ id: "sty_a", villaId: "t01" })],
        effectiveAt: "2026-10-01T00:00:00.000Z",
      });
    });
    assert.deepEqual(await instructions(pg), [
      {
        booking_id: "bkg_a",
        retained_identity_id: "usr_p0",
        direction: "RETAIN",
        set_by: "Stayora vận hành (admin key)",
        basis: BASIS_ADMIN_EXCEPTION,
      },
    ]);
    const payout = source("./hosting-payout.ts");
    const transfer = source("./hosting-transfer.ts");
    for (const body of [payout, transfer]) {
      assert.equal(/insert into payments|stripe|executePayout|transferFunds/i.test(body), false);
      assert.equal(/update\s+payout_recipient_instructions/i.test(body), false);
    }
  });
});

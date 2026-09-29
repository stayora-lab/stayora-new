import { randomBytes } from "node:crypto";
import { activePrimaryFor, type Queryable } from "./hosting.ts";
import {
  classifyTransferCohort,
  isPayoutChoice,
  PAYOUT_RETAIN,
  type CohortBooking,
  type CohortStay,
  type PayoutChoice,
  type PayoutLine,
  type RetainedPayout,
} from "./hosting-payout-model.ts";
import { BASIS_TRANSFER_PENDING } from "./hosting-transfer-model.ts";

export type { CohortBooking, CohortStay, PayoutChoice, PayoutLine } from "./hosting-payout-model.ts";
export {
  PAYOUT_FOLLOW_INCOMING,
  PAYOUT_MANUAL_NOTE,
  PAYOUT_RETAIN,
  classifyTransferCohort,
  resolvePayoutRecipient,
} from "./hosting-payout-model.ts";

/**
 * PROTOTYPE ASSUMPTION: the pending choice is one row per designation, not
 * one row per booking. ADR-P076 forbids a per-booking editor. FOLLOW INCOMING
 * is stored only while the designation is pending, so an explicit choice is
 * distinguishable from silence in the audit. It does not become a durable
 * override. Durable rows are RETAIN only, inserted once, never updated.
 *
 * PROTOTYPE ASSUMPTION: the cohort is whatever snapshot the caller passes,
 * taken when the transfer becomes effective. A booking confirmed after that
 * read and before commit can be missed. Silence and FOLLOW INCOMING insert
 * no durable row, so they cannot cancel an earlier RETAIN.
 *
 * PROTOTYPE ASSUMPTION: ADR-P076 gives this choice to the outgoing Primary.
 * It does not say an operator may choose during Admin manual replacement.
 * adminReplacePrimary may pass a choice anyway, because that path has no
 * pending window. The retained identity is the outgoing Primary. set_by is
 * the operator. No selection writes nothing.
 */

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

async function writeAudit(
  db: Queryable,
  input: {
    unitId: string;
    event: string;
    basis: string;
    actor: string;
    subjectIdentityId?: string | null;
    detail?: string | null;
  },
): Promise<void> {
  await db.query(
    `insert into hosting_audit (id, unit_id, event, basis, actor, subject_identity_id, detail)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      newId("haud"),
      input.unitId,
      input.event,
      input.basis,
      input.actor,
      input.subjectIdentityId ?? null,
      input.detail ?? null,
    ],
  );
}

export async function setTransferPayoutChoice(
  db: Queryable,
  input: { designationId: string; actorId: string; choice: PayoutChoice },
): Promise<void> {
  if (!isPayoutChoice(input.choice)) throw new Error("Lựa chọn không hợp lệ");
  const rows = await db.query<{
    id: string;
    unit_id: string;
    status: string;
    outgoing_identity_id: string;
  }>(
    `select id, unit_id, status, outgoing_identity_id
     from primary_designations where id = $1 for update`,
    [input.designationId],
  );
  const row = rows[0];
  if (!row || row.status !== "PENDING") {
    throw new Error("Đề cử không còn chờ nên không sửa lựa chọn này");
  }
  const primary = await activePrimaryFor(db, row.unit_id);
  if (!primary || primary.identityId !== input.actorId || row.outgoing_identity_id !== input.actorId) {
    throw new Error("Chỉ chủ nhà chính đang chuyển mới chọn được");
  }
  await db.query(
    `insert into transfer_payout_choices (designation_id, choice, set_by, set_at)
     values ($1, $2, $3, now())
     on conflict (designation_id) do update
     set choice = excluded.choice, set_by = excluded.set_by, set_at = now()`,
    [row.id, input.choice, input.actorId],
  );
  await writeAudit(db, {
    unitId: row.unit_id,
    event: "payout-choice",
    basis: BASIS_TRANSFER_PENDING,
    actor: input.actorId,
    subjectIdentityId: input.actorId,
    detail: `choice=${input.choice};transfer=${row.id}`,
  });
}

export async function readPayoutChoice(db: Queryable, designationId: string): Promise<PayoutChoice | null> {
  const rows = await db.query<{ choice: string }>(
    `select choice from transfer_payout_choices where designation_id = $1`,
    [designationId],
  );
  const choice = rows[0]?.choice;
  return choice && isPayoutChoice(choice) ? choice : null;
}

export async function listPayoutInstructions(
  db: Queryable,
  unitId: string,
): Promise<RetainedPayout[]> {
  const rows = await db.query<{
    booking_id: string;
    retained_identity_id: string;
    retained_name: string | null;
  }>(
    `select i.booking_id, i.retained_identity_id, d.name as retained_name
     from payout_recipient_instructions i
     left join dev_identity d on d.id = i.retained_identity_id
     where i.unit_id = $1
     order by i.booking_id`,
    [unitId],
  );
  return rows.map((row) => ({
    bookingId: row.booking_id,
    retainedIdentityId: row.retained_identity_id,
    retainedName: row.retained_name,
  }));
}

/**
 * Bind the already-recorded choice. Inserts RETAIN rows for the attributable
 * cohort only. Existing rows are left untouched. FOLLOW INCOMING and null
 * insert nothing. Does not move money.
 */
export async function bindPayoutChoice(
  db: Queryable,
  input: {
    unitId: string;
    outgoingIdentityId: string;
    choice: PayoutChoice | null;
    transferRef: string;
    setBy: string;
    basis: string;
    actor: string;
    bookings: readonly CohortBooking[];
    stays: readonly CohortStay[];
    effectiveAt: string;
  },
): Promise<{ written: string[] }> {
  const retained = await listPayoutInstructions(db, input.unitId);
  const lines = classifyTransferCohort({
    unitId: input.unitId,
    effectiveAt: input.effectiveAt,
    bookings: input.bookings,
    stays: input.stays,
    retained,
  });
  const written: string[] = [];
  if (input.choice === PAYOUT_RETAIN) {
    for (const line of lines) {
      if (line.kind !== "attributable") continue;
      const inserted = await db.query<{ booking_id: string }>(
        `insert into payout_recipient_instructions (
           booking_id, unit_id, direction, retained_identity_id, transfer_ref, set_by, basis
         )
         select $1, $2, 'RETAIN', $3, $4, $5, $6
         where not exists (
           select 1 from payout_recipient_instructions where booking_id = $1
         )
         returning booking_id`,
        [line.bookingId, input.unitId, input.outgoingIdentityId, input.transferRef, input.setBy, input.basis],
      );
      if (inserted[0]) written.push(inserted[0].booking_id);
    }
  }
  await writeAudit(db, {
    unitId: input.unitId,
    event: "payout-choice-binding",
    basis: input.basis,
    actor: input.actor,
    subjectIdentityId: input.outgoingIdentityId,
    detail: `choice=${input.choice ?? "NONE"};transfer=${input.transferRef};bookings=${written.join(",")}`,
  });
  return { written };
}

/**
 * Primary whose relationship covers the actual check-in instant.
 * PROTOTYPE ASSUMPTION: valid_from is inclusive and valid_to is exclusive.
 * The ADR does not define the boundary instant.
 */
export async function primaryIdentityAt(
  db: Queryable,
  unitId: string,
  at: string,
): Promise<string | null> {
  const rows = await db.query<{ identity_id: string }>(
    `select identity_id from hosting_relationships
     where unit_id = $1 and kind = 'PRIMARY'
       and valid_from <= $2::timestamptz
       and (valid_to is null or valid_to > $2::timestamptz)
     order by valid_from desc
     limit 1`,
    [unitId, at],
  );
  return rows[0]?.identity_id ?? null;
}

export async function payoutDeskForUnit(
  db: Queryable,
  input: {
    unitId: string;
    designationId: string | null;
    includeCohort: boolean;
    bookings: readonly CohortBooking[];
    stays: readonly CohortStay[];
    effectiveAt: string;
  },
): Promise<{
  pendingChoice: PayoutChoice | null;
  lines: PayoutLine[];
  recorded: RetainedPayout[];
}> {
  const recorded = await listPayoutInstructions(db, input.unitId);
  const pendingChoice = input.designationId ? await readPayoutChoice(db, input.designationId) : null;
  if (!input.includeCohort) {
    return { pendingChoice, lines: [], recorded };
  }
  return {
    pendingChoice,
    recorded,
    lines: classifyTransferCohort({
      unitId: input.unitId,
      effectiveAt: input.effectiveAt,
      bookings: input.bookings,
      stays: input.stays,
      retained: recorded,
    }),
  };
}

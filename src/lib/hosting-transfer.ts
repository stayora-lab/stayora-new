import { randomBytes } from "node:crypto";
import { PILOT_SEED } from "./pilot-data.ts";
import {
  activePrimaryFor,
  endHostingRelationship,
  establishPrimaryHost,
  type Queryable,
} from "./hosting.ts";
import {
  BASIS_ADMIN_EXCEPTION,
  BASIS_COHOST,
  BASIS_NORMAL_ACCEPTANCE,
  BASIS_TRANSFER_PENDING,
  COHOST_ROLE,
  type DeskCohost,
  type DeskUnit,
  type IncomingDesignation,
} from "./hosting-transfer-model.ts";

export {
  BASIS_ADMIN_EXCEPTION,
  BASIS_COHOST,
  BASIS_NORMAL_ACCEPTANCE,
  BASIS_TRANSFER_PENDING,
  COHOST_ROLE,
  cohostRemovalMatters,
} from "./hosting-transfer-model.ts";
export type { DeskCohost, DeskUnit, IncomingDesignation, RemovalMatter } from "./hosting-transfer-model.ts";

/**
 * Co-host is not a second Primary and not a villa-scoped HOST grant.
 * H-1 creates a HOST grant only inside establishPrimaryHost, for the person
 * who holds the active PRIMARY relationship. Delegation has to be distinguishable
 * so a Co-host cannot designate, invite, or remove. 04-delegation-and-scope.md
 * does not prescribe a storage shape.
 *
 * PROTOTYPE ASSUMPTION: role COHOST, scope_ref = the unit id, granted_by = the
 * Primary identity who is the source. The spec says a granted Co-host can
 * accept and reject, and that the delegable catalogue is otherwise TBD, so
 * this grant opens the existing host workspace for that unit and nothing finer.
 * It does not include Delegation Authority. The host page's existing actions
 * outside the standard set stay as they are; this slice does not add a second
 * host surface.
 *
 * PROTOTYPE ASSUMPTION: a retained Co-host grant keeps the same row, but
 * granted_by and granted_at are rewritten to the incoming Primary in the
 * acceptance transaction. The spec requires incoming-Primary provenance and
 * does not say whether that is a new grant id. The capability does not lapse.
 * A Co-host who becomes Primary loses the COHOST row in that same transaction.
 *
 * PROTOTYPE ASSUMPTION: an email with no account yet is a pending invite.
 * It becomes a COHOST grant when that person is signed in and the desk loads,
 * and only if the inviting Primary is still Primary. There is no second
 * acceptance. Invitation expiry is still open in the spec, so none is applied.
 * Pending invites are cancelled when Primary changes; they were not grants yet.
 *
 * Payout choice (ADR-P076) is not recorded or shown here.
 */

const VILLA_IDS = new Set(PILOT_SEED.villas.map((villa) => villa.id));

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function assertUnit(unitId: string): void {
  if (!VILLA_IDS.has(unitId)) throw new Error("Villa không có trong danh sách");
}

function cleanEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (!value.includes("@")) throw new Error("Cần email người nhận");
  return value;
}

function cleanName(name: string): string {
  const value = name.trim();
  if (!value) throw new Error("Cần tên người nhận");
  return value;
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

async function requirePrimary(db: Queryable, unitId: string, actorId: string) {
  const primary = await activePrimaryFor(db, unitId);
  if (!primary || primary.identityId !== actorId) {
    throw new Error("Chỉ chủ nhà chính của villa này làm được việc này");
  }
  return primary;
}

export async function designateSuccessor(
  db: Queryable,
  input: {
    unitId: string;
    actorId: string;
    recipientIdentityId?: string | null;
    recipientEmail: string;
    recipientName: string;
  },
): Promise<{ designationId: string }> {
  assertUnit(input.unitId);
  const email = cleanEmail(input.recipientEmail);
  const name = cleanName(input.recipientName);
  if (input.recipientIdentityId && input.recipientIdentityId === input.actorId) {
    throw new Error("Không tự đề cử mình");
  }
  await requirePrimary(db, input.unitId, input.actorId);
  await db.query(
    `update primary_designations
     set status = 'REPLACED', decided_at = now(), decided_by = $2
     where unit_id = $1 and status = 'PENDING'`,
    [input.unitId, input.actorId],
  );
  const designationId = newId("des");
  await db.query(
    `insert into primary_designations (
       id, unit_id, outgoing_identity_id, recipient_identity_id, recipient_email, recipient_name, status
     ) values ($1, $2, $3, $4, $5, $6, 'PENDING')`,
    [designationId, input.unitId, input.actorId, input.recipientIdentityId ?? null, email, name],
  );
  await writeAudit(db, {
    unitId: input.unitId,
    event: "designation",
    basis: BASIS_TRANSFER_PENDING,
    actor: input.actorId,
    subjectIdentityId: input.recipientIdentityId ?? null,
    detail: email,
  });
  return { designationId };
}

export async function cancelDesignation(
  db: Queryable,
  input: { designationId: string; actorId: string },
): Promise<void> {
  const rows = await db.query<{ id: string; unit_id: string; outgoing_identity_id: string; status: string }>(
    `select id, unit_id, outgoing_identity_id, status
     from primary_designations where id = $1 for update`,
    [input.designationId],
  );
  const row = rows[0];
  if (!row || row.status !== "PENDING") throw new Error("Không còn đề cử đang chờ");
  if (row.outgoing_identity_id !== input.actorId) {
    throw new Error("Chỉ chủ nhà chính đang đề cử mới hủy được");
  }
  await db.query(
    `update primary_designations
     set status = 'CANCELLED', decided_at = now(), decided_by = $2
     where id = $1 and status = 'PENDING'`,
    [row.id, input.actorId],
  );
  await writeAudit(db, {
    unitId: row.unit_id,
    event: "designation-cancelled",
    basis: BASIS_TRANSFER_PENDING,
    actor: input.actorId,
  });
}

export async function declineDesignation(
  db: Queryable,
  input: { designationId: string; actorId: string; actorEmail: string },
): Promise<void> {
  const rows = await db.query<{
    id: string;
    unit_id: string;
    status: string;
    recipient_identity_id: string | null;
    recipient_email: string;
  }>(
    `select id, unit_id, status, recipient_identity_id, recipient_email
     from primary_designations where id = $1 for update`,
    [input.designationId],
  );
  const row = rows[0];
  if (!row || row.status !== "PENDING") throw new Error("Không còn đề cử đang chờ");
  if (!isRecipient(row, input.actorId, input.actorEmail)) {
    throw new Error("Chỉ người được đề cử mới từ chối được");
  }
  await db.query(
    `update primary_designations
     set status = 'DECLINED', decided_at = now(), decided_by = $2
     where id = $1 and status = 'PENDING'`,
    [row.id, input.actorId],
  );
  await writeAudit(db, {
    unitId: row.unit_id,
    event: "designation-declined",
    basis: BASIS_TRANSFER_PENDING,
    actor: input.actorId,
  });
}

function isRecipient(
  row: { recipient_identity_id: string | null; recipient_email: string },
  actorId: string,
  actorEmail: string,
): boolean {
  if (row.recipient_identity_id) return row.recipient_identity_id === actorId;
  return row.recipient_email === actorEmail.trim().toLowerCase();
}

async function lockPrimary(db: Queryable, unitId: string) {
  const rows = await db.query<{ id: string; identity_id: string }>(
    `select id, identity_id from hosting_relationships
     where unit_id = $1 and kind = 'PRIMARY' and valid_to is null
     for update`,
    [unitId],
  );
  return rows[0] ?? null;
}

async function retargetCohosts(
  db: Queryable,
  input: { unitId: string; incomingId: string; removeIds: ReadonlySet<string>; actor: string },
): Promise<void> {
  const rows = await db.query<{ id: string; user_id: string }>(
    `select id, user_id from role_grants
     where role = $2 and scope_ref = $1 and status = 'active'
     order by user_id`,
    [input.unitId, COHOST_ROLE],
  );
  for (const row of rows) {
    const dropping = row.user_id === input.incomingId || input.removeIds.has(row.user_id);
    if (dropping) {
      await db.query(
        `update role_grants set status = 'revoked', granted_by = $2, granted_at = now() where id = $1`,
        [row.id, input.actor],
      );
      if (row.user_id !== input.incomingId) {
        await writeAudit(db, {
          unitId: input.unitId,
          event: "cohost-remove",
          basis: BASIS_COHOST,
          actor: input.actor,
          subjectIdentityId: row.user_id,
          detail: "removed when Primary changed",
        });
      }
      continue;
    }
    await db.query(
      `update role_grants set granted_by = $2, granted_at = now() where id = $1`,
      [row.id, input.incomingId],
    );
    await writeAudit(db, {
      unitId: input.unitId,
      event: "cohost-retain",
      basis: BASIS_COHOST,
      actor: input.incomingId,
      subjectIdentityId: row.user_id,
      detail: "incoming Primary is now the source",
    });
  }
  await db.query(
    `update cohost_invites set status = 'CANCELLED'
     where unit_id = $1 and status = 'PENDING'`,
    [input.unitId],
  );
}

/**
 * Recipient acceptance. Ends the outgoing Primary, then establishPrimaryHost
 * for the incoming identity. Does not copy HOST_DAMAGE or any other grant.
 * The caller must run this inside one transaction.
 */
export async function acceptDesignation(
  db: Queryable,
  input: {
    designationId: string;
    actorId: string;
    actorEmail: string;
    removeCohostIds?: readonly string[];
  },
): Promise<{ unitId: string }> {
  const peeked = await db.query<{ unit_id: string }>(
    `select unit_id from primary_designations where id = $1`,
    [input.designationId],
  );
  const unitId = peeked[0]?.unit_id;
  if (!unitId) throw new Error("Không còn đề cử đang chờ");
  const primary = await lockPrimary(db, unitId);
  const rows = await db.query<{
    id: string;
    unit_id: string;
    status: string;
    outgoing_identity_id: string;
    recipient_identity_id: string | null;
    recipient_email: string;
  }>(
    `select id, unit_id, status, outgoing_identity_id, recipient_identity_id, recipient_email
     from primary_designations where id = $1 for update`,
    [input.designationId],
  );
  const row = rows[0];
  if (!row || row.status !== "PENDING") throw new Error("Không còn đề cử đang chờ");
  if (!isRecipient(row, input.actorId, input.actorEmail)) {
    throw new Error("Chỉ người được đề cử mới chấp nhận được");
  }
  if (!primary || primary.identity_id !== row.outgoing_identity_id) {
    throw new Error("Chủ nhà chính đã đổi. Đề cử này không còn hiệu lực");
  }
  await endHostingRelationship(db, { relationshipId: primary.id, endedBy: input.actorId });
  await establishPrimaryHost(db, {
    unitId: row.unit_id,
    identityId: input.actorId,
    grantedBy: BASIS_NORMAL_ACCEPTANCE,
  });
  await retargetCohosts(db, {
    unitId: row.unit_id,
    incomingId: input.actorId,
    removeIds: new Set(input.removeCohostIds ?? []),
    actor: input.actorId,
  });
  await db.query(
    `update primary_designations
     set status = 'ACCEPTED', decided_at = now(), decided_by = $2,
         recipient_identity_id = coalesce(recipient_identity_id, $2)
     where id = $1 and status = 'PENDING'`,
    [row.id, input.actorId],
  );
  await writeAudit(db, {
    unitId: row.unit_id,
    event: "acceptance",
    basis: BASIS_NORMAL_ACCEPTANCE,
    actor: input.actorId,
    subjectIdentityId: row.outgoing_identity_id,
    detail: `designatedBy=${row.outgoing_identity_id};acceptedBy=${input.actorId}`,
  });
  return { unitId: row.unit_id };
}

export async function adminReplacePrimary(
  db: Queryable,
  input: {
    unitId: string;
    incomingIdentityId: string;
    reason: string;
    actor: string;
  },
): Promise<void> {
  assertUnit(input.unitId);
  const reason = input.reason.trim();
  if (!reason) throw new Error("Cần một lý do ngắn");
  const primary = await lockPrimary(db, input.unitId);
  if (!primary) throw new Error("Villa này chưa có chủ nhà chính để thay");
  if (primary.identity_id === input.incomingIdentityId) {
    throw new Error("Người này đã là chủ nhà chính");
  }
  await db.query(
    `update primary_designations
     set status = 'CANCELLED', decided_at = now(), decided_by = $2
     where unit_id = $1 and status = 'PENDING'`,
    [input.unitId, input.actor],
  );
  await endHostingRelationship(db, { relationshipId: primary.id, endedBy: input.actor });
  await establishPrimaryHost(db, {
    unitId: input.unitId,
    identityId: input.incomingIdentityId,
    grantedBy: input.actor,
  });
  await retargetCohosts(db, {
    unitId: input.unitId,
    incomingId: input.incomingIdentityId,
    removeIds: new Set(),
    actor: input.actor,
  });
  await writeAudit(db, {
    unitId: input.unitId,
    event: "admin-replace",
    basis: BASIS_ADMIN_EXCEPTION,
    actor: input.actor,
    subjectIdentityId: input.incomingIdentityId,
    detail: reason,
  });
}

async function upsertCohost(
  db: Queryable,
  input: { unitId: string; identityId: string; grantedBy: string },
): Promise<void> {
  const existing = await db.query<{ id: string }>(
    `select id from role_grants
     where user_id = $1 and role = $3 and scope_ref = $2`,
    [input.identityId, input.unitId, COHOST_ROLE],
  );
  if (existing[0]) {
    await db.query(
      `update role_grants
       set status = 'active', granted_by = $2, granted_at = now()
       where id = $1`,
      [existing[0].id, input.grantedBy],
    );
    return;
  }
  await db.query(
    `insert into role_grants (id, user_id, role, scope_ref, status, granted_by, granted_at)
     values ($1, $2, $3, $4, 'active', $5, now())`,
    [newId("grant"), input.identityId, COHOST_ROLE, input.unitId, input.grantedBy],
  );
}

export async function inviteCohost(
  db: Queryable,
  input: {
    unitId: string;
    actorId: string;
    recipientIdentityId?: string | null;
    recipientEmail: string;
    recipientName: string;
  },
): Promise<void> {
  assertUnit(input.unitId);
  const email = cleanEmail(input.recipientEmail);
  const name = cleanName(input.recipientName);
  if (input.recipientIdentityId && input.recipientIdentityId === input.actorId) {
    throw new Error("Chủ nhà chính không tự mời mình làm co-host");
  }
  await requirePrimary(db, input.unitId, input.actorId);
  if (input.recipientIdentityId) {
    await upsertCohost(db, {
      unitId: input.unitId,
      identityId: input.recipientIdentityId,
      grantedBy: input.actorId,
    });
    await writeAudit(db, {
      unitId: input.unitId,
      event: "cohost-invite",
      basis: BASIS_COHOST,
      actor: input.actorId,
      subjectIdentityId: input.recipientIdentityId,
      detail: email,
    });
    return;
  }
  await db.query(
    `update cohost_invites set status = 'CANCELLED'
     where unit_id = $1 and lower(recipient_email) = $2 and status = 'PENDING'`,
    [input.unitId, email],
  );
  await db.query(
    `insert into cohost_invites (id, unit_id, inviter_identity_id, recipient_email, recipient_name, status)
     values ($1, $2, $3, $4, $5, 'PENDING')`,
    [newId("cinv"), input.unitId, input.actorId, email, name],
  );
  await writeAudit(db, {
    unitId: input.unitId,
    event: "cohost-invite",
    basis: BASIS_COHOST,
    actor: input.actorId,
    detail: email,
  });
}

export async function removeCohost(
  db: Queryable,
  input: { unitId: string; actorId: string; cohostIdentityId: string },
): Promise<void> {
  assertUnit(input.unitId);
  await requirePrimary(db, input.unitId, input.actorId);
  const rows = await db.query<{ id: string }>(
    `select id from role_grants
     where user_id = $1 and role = $3 and scope_ref = $2 and status = 'active'`,
    [input.cohostIdentityId, input.unitId, COHOST_ROLE],
  );
  if (!rows[0]) throw new Error("Không có co-host này");
  await db.query(
    `update role_grants set status = 'revoked', granted_by = $2, granted_at = now() where id = $1`,
    [rows[0].id, input.actorId],
  );
  await writeAudit(db, {
    unitId: input.unitId,
    event: "cohost-remove",
    basis: BASIS_COHOST,
    actor: input.actorId,
    subjectIdentityId: input.cohostIdentityId,
  });
}

/** Pending email invites become grants only while the inviter is still Primary. */
export async function materializeCohostInvites(
  db: Queryable,
  input: { identityId: string; email: string },
): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const invites = await db.query<{
    id: string;
    unit_id: string;
    inviter_identity_id: string;
  }>(
    `select id, unit_id, inviter_identity_id
     from cohost_invites
     where status = 'PENDING' and lower(recipient_email) = $1`,
    [email],
  );
  for (const invite of invites) {
    const primary = await activePrimaryFor(db, invite.unit_id);
    if (!primary || primary.identityId !== invite.inviter_identity_id || primary.identityId === input.identityId) {
      await db.query(`update cohost_invites set status = 'CANCELLED' where id = $1`, [invite.id]);
      continue;
    }
    await upsertCohost(db, {
      unitId: invite.unit_id,
      identityId: input.identityId,
      grantedBy: primary.identityId,
    });
    await db.query(`update cohost_invites set status = 'GRANTED' where id = $1`, [invite.id]);
    await writeAudit(db, {
      unitId: invite.unit_id,
      event: "cohost-invite",
      basis: BASIS_COHOST,
      actor: primary.identityId,
      subjectIdentityId: input.identityId,
      detail: email,
    });
  }
}

export async function loadTransferDesk(
  db: Queryable,
  input: { identityId: string; email: string },
): Promise<{ primaryUnits: DeskUnit[]; incoming: IncomingDesignation[] }> {
  await materializeCohostInvites(db, input);
  const primaries = await db.query<{ unit_id: string }>(
    `select unit_id from hosting_relationships
     where identity_id = $1 and kind = 'PRIMARY' and valid_to is null
     order by unit_id`,
    [input.identityId],
  );
  const primaryUnits: DeskUnit[] = [];
  for (const primary of primaries) {
    primaryUnits.push({
      unitId: primary.unit_id,
      pending: await pendingFor(db, primary.unit_id),
      cohosts: await cohostsFor(db, primary.unit_id),
    });
  }
  const incomingRows = await db.query<{ id: string; unit_id: string }>(
    `select id, unit_id from primary_designations
     where status = 'PENDING'
       and (
         recipient_identity_id = $1
         or (recipient_identity_id is null and lower(recipient_email) = $2)
       )
     order by created_at`,
    [input.identityId, input.email.trim().toLowerCase()],
  );
  const incoming: IncomingDesignation[] = [];
  for (const row of incomingRows) {
    incoming.push({
      id: row.id,
      unitId: row.unit_id,
      cohosts: await cohostsFor(db, row.unit_id),
    });
  }
  return { primaryUnits, incoming };
}

async function pendingFor(db: Queryable, unitId: string) {
  const rows = await db.query<{ id: string; recipient_name: string; recipient_email: string }>(
    `select id, recipient_name, recipient_email
     from primary_designations where unit_id = $1 and status = 'PENDING'`,
    [unitId],
  );
  const row = rows[0];
  return row
    ? { id: row.id, recipientName: row.recipient_name, recipientEmail: row.recipient_email }
    : null;
}

async function cohostsFor(db: Queryable, unitId: string): Promise<DeskCohost[]> {
  const rows = await db.query<{ user_id: string; name: string | null; email: string | null }>(
    `select g.user_id, i.name, i.email
     from role_grants g
     left join dev_identity i on i.id = g.user_id
     where g.role = $2 and g.scope_ref = $1 and g.status = 'active'
     order by g.user_id`,
    [unitId, COHOST_ROLE],
  );
  return rows.map((row) => ({
    identityId: row.user_id,
    name: row.name ?? row.user_id,
    email: row.email ?? "",
  }));
}

export async function auditBasisFor(
  db: Queryable,
  unitId: string,
): Promise<{ event: string; basis: string; actor: string; detail: string | null }[]> {
  return db.query(
    `select event, basis, actor, detail from hosting_audit where unit_id = $1 order by created_at, event`,
    [unitId],
  );
}

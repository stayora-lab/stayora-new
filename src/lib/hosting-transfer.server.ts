import { authorizeRole } from "./authorize.ts";
import { withTransaction } from "./db.ts";
import { currentDevUser, findIdentityByEmail, searchIdentityDirectory } from "./dev-identity.server.ts";
import { ensureCataloguePrimaries } from "./hosting.ts";
import { HOSTING_ADMIN_ACTOR } from "./hosting-model.ts";
import { cohortEffectiveAt, isPayoutChoice, type CohortBooking, type CohortStay, type PayoutChoice } from "./hosting-payout-model.ts";
import { payoutDeskForUnit, setTransferPayoutChoice } from "./hosting-payout.ts";
import {
  acceptDesignation,
  adminReplacePrimary,
  cancelDesignation,
  declineDesignation,
  designateSuccessor,
  inviteCohost,
  loadTransferDesk,
  removeCohost,
  type IncomingDesignation,
  type DeskUnit,
} from "./hosting-transfer.ts";
import { readWorld } from "./world.server.ts";

function assertOperator(key: string | null | undefined): void {
  if (authorizeRole("admin", key).persona !== "ADMIN") {
    throw new Error("Chỉ Stayora vận hành được xử lý yêu cầu này");
  }
}

async function signedIn() {
  const user = await currentDevUser();
  if (!user) throw new Error("Đăng nhập để chuyển giao");
  return user;
}

async function cohortSnapshot(): Promise<{
  bookings: CohortBooking[];
  stays: CohortStay[];
  effectiveAt: string;
}> {
  const { world } = await readWorld();
  return {
    effectiveAt: cohortEffectiveAt({ worldNow: world.now, databaseNow: new Date().toISOString() }),
    bookings: world.bookings.map((booking) => ({
      id: booking.id,
      villaId: booking.villaId,
      reference: booking.reference,
      guestName: booking.guestName,
      status: booking.status,
      confirmedAt: booking.confirmedAt,
      stayId: booking.stayId,
      checkIn: booking.checkIn,
    })),
    stays: world.stays.map((stay) => ({
      id: stay.id,
      villaId: stay.villaId,
      status: stay.status,
      checkedInAt: stay.checkedInAt ?? null,
      bookingId: stay.bookingId ?? null,
    })),
  };
}

function payoutChoiceOrNull(value: string | null | undefined): PayoutChoice | null {
  if (!value) return null;
  if (!isPayoutChoice(value)) throw new Error("Lựa chọn không hợp lệ");
  return value;
}

async function resolveRecipient(input: {
  recipientIdentityId?: string | null;
  recipientEmail: string;
  recipientName: string;
}) {
  if (input.recipientIdentityId) {
    return {
      recipientIdentityId: input.recipientIdentityId,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
    };
  }
  const found = await findIdentityByEmail(input.recipientEmail);
  if (found) {
    return {
      recipientIdentityId: found.id,
      recipientEmail: found.email,
      recipientName: found.name,
    };
  }
  return {
    recipientIdentityId: null,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
  };
}

export async function submitDesignation(input: {
  unitId: string;
  recipientIdentityId?: string | null;
  recipientEmail: string;
  recipientName: string;
}): Promise<void> {
  const user = await signedIn();
  const recipient = await resolveRecipient(input);
  await withTransaction((sql) =>
    designateSuccessor(sql, {
      unitId: input.unitId,
      actorId: user.id,
      ...recipient,
    }),
  );
}

export async function submitCancelDesignation(designationId: string): Promise<void> {
  const user = await signedIn();
  await withTransaction((sql) => cancelDesignation(sql, { designationId, actorId: user.id }));
}

export async function submitDeclineDesignation(designationId: string): Promise<void> {
  const user = await signedIn();
  await withTransaction((sql) =>
    declineDesignation(sql, { designationId, actorId: user.id, actorEmail: user.email }),
  );
}

export async function submitAcceptDesignation(input: {
  designationId: string;
  removeCohostIds?: string[];
}): Promise<void> {
  const user = await signedIn();
  const cohort = await cohortSnapshot();
  await withTransaction((sql) =>
    acceptDesignation(sql, {
      designationId: input.designationId,
      actorId: user.id,
      actorEmail: user.email,
      removeCohostIds: input.removeCohostIds,
      bookings: cohort.bookings,
      stays: cohort.stays,
      effectiveAt: cohort.effectiveAt,
    }),
  );
}

export async function submitPayoutChoice(input: { designationId: string; choice: PayoutChoice }): Promise<void> {
  const user = await signedIn();
  const choice = payoutChoiceOrNull(input.choice);
  if (!choice) throw new Error("Lựa chọn không hợp lệ");
  await withTransaction((sql) =>
    setTransferPayoutChoice(sql, { designationId: input.designationId, actorId: user.id, choice }),
  );
}

export async function submitCohostInvite(input: {
  unitId: string;
  recipientIdentityId?: string | null;
  recipientEmail: string;
  recipientName: string;
}): Promise<void> {
  const user = await signedIn();
  const recipient = await resolveRecipient(input);
  await withTransaction((sql) =>
    inviteCohost(sql, { unitId: input.unitId, actorId: user.id, ...recipient }),
  );
}

export async function submitCohostRemove(input: { unitId: string; cohostIdentityId: string }): Promise<void> {
  const user = await signedIn();
  await withTransaction((sql) =>
    removeCohost(sql, { unitId: input.unitId, actorId: user.id, cohostIdentityId: input.cohostIdentityId }),
  );
}

export async function transferDesk(): Promise<{ primaryUnits: DeskUnit[]; incoming: IncomingDesignation[] }> {
  const user = await signedIn();
  const cohort = await cohortSnapshot();
  return withTransaction((sql) =>
    loadTransferDesk(sql, {
      identityId: user.id,
      email: user.email,
      bookings: cohort.bookings,
      stays: cohort.stays,
      now: cohort.effectiveAt,
    }),
  );
}

export async function searchTransferRecipients(query: string) {
  const user = await signedIn();
  const allowed = await withTransaction(async (sql) => {
    const rows = await sql.query<{ id: string }>(
      `select id from hosting_relationships
       where identity_id = $1 and kind = 'PRIMARY' and valid_to is null
       limit 1`,
      [user.id],
    );
    return Boolean(rows[0]);
  });
  if (!allowed) throw new Error("Chỉ chủ nhà chính tìm người nhận");
  return searchIdentityDirectory(query);
}

export async function adminTransferPreview(input: { unitId: string; key?: string | null }): Promise<{
  primaryIdentityId: string | null;
  cohosts: { identityId: string; name: string; email: string }[];
  payout: Awaited<ReturnType<typeof payoutDeskForUnit>>;
}> {
  assertOperator(input.key);
  await withTransaction((sql) => ensureCataloguePrimaries(sql));
  const cohort = await cohortSnapshot();
  return withTransaction(async (sql) => {
    const primary = await sql.query<{ identity_id: string }>(
      `select identity_id from hosting_relationships
       where unit_id = $1 and kind = 'PRIMARY' and valid_to is null`,
      [input.unitId],
    );
    const cohosts = await sql.query<{ user_id: string; name: string | null; email: string | null }>(
      `select g.user_id, i.name, i.email
       from role_grants g
       left join dev_identity i on i.id = g.user_id
       where g.role = 'COHOST' and g.scope_ref = $1 and g.status = 'active'
       order by g.user_id`,
      [input.unitId],
    );
    const payout = await payoutDeskForUnit(sql, {
      unitId: input.unitId,
      designationId: null,
      includeCohort: true,
      bookings: cohort.bookings,
      stays: cohort.stays,
      effectiveAt: cohort.effectiveAt,
    });
    return {
      primaryIdentityId: primary[0]?.identity_id ?? null,
      cohosts: cohosts.map((row) => ({
        identityId: row.user_id,
        name: row.name ?? row.user_id,
        email: row.email ?? "",
      })),
      payout,
    };
  });
}

export async function submitAdminReplace(input: {
  unitId: string;
  incomingIdentityId: string;
  reason: string;
  payoutChoice?: string | null;
  key?: string | null;
}): Promise<void> {
  assertOperator(input.key);
  const payoutChoice = payoutChoiceOrNull(input.payoutChoice);
  await withTransaction((sql) => ensureCataloguePrimaries(sql));
  const cohort = await cohortSnapshot();
  await withTransaction((sql) =>
    adminReplacePrimary(sql, {
      unitId: input.unitId,
      incomingIdentityId: input.incomingIdentityId,
      reason: input.reason,
      actor: HOSTING_ADMIN_ACTOR,
      payoutChoice,
      bookings: cohort.bookings,
      stays: cohort.stays,
      effectiveAt: cohort.effectiveAt,
    }),
  );
}

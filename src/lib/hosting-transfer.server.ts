import { authorizeRole } from "./authorize.ts";
import { withTransaction } from "./db.ts";
import { currentDevUser, findIdentityByEmail, searchIdentityDirectory } from "./dev-identity.server.ts";
import { ensureCataloguePrimaries } from "./hosting.ts";
import { HOSTING_ADMIN_ACTOR } from "./hosting-model.ts";
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
  await withTransaction((sql) =>
    acceptDesignation(sql, {
      designationId: input.designationId,
      actorId: user.id,
      actorEmail: user.email,
      removeCohostIds: input.removeCohostIds,
    }),
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
  return withTransaction((sql) => loadTransferDesk(sql, { identityId: user.id, email: user.email }));
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
}> {
  assertOperator(input.key);
  await withTransaction((sql) => ensureCataloguePrimaries(sql));
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
    return {
      primaryIdentityId: primary[0]?.identity_id ?? null,
      cohosts: cohosts.map((row) => ({
        identityId: row.user_id,
        name: row.name ?? row.user_id,
        email: row.email ?? "",
      })),
    };
  });
}

export async function submitAdminReplace(input: {
  unitId: string;
  incomingIdentityId: string;
  reason: string;
  key?: string | null;
}): Promise<void> {
  assertOperator(input.key);
  await withTransaction((sql) => ensureCataloguePrimaries(sql));
  await withTransaction((sql) =>
    adminReplacePrimary(sql, {
      unitId: input.unitId,
      incomingIdentityId: input.incomingIdentityId,
      reason: input.reason,
      actor: HOSTING_ADMIN_ACTOR,
    }),
  );
}

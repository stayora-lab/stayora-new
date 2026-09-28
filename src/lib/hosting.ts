import { randomBytes } from "node:crypto";
import { PILOT_SEED } from "./pilot-data.ts";
import {
  HOSTING_ADMIN_ACTOR,
  HOSTING_VERIFICATION_BASIS,
  OCEANAMI_DESTINATION_ID,
  PrimaryOccupiedError,
  applicantRequestsFrom,
  assertHostingContact,
  planHostingUnits,
  type AdminRequestView,
  type AdminUnitView,
  type ApplicantRequestView,
  type ContactFields,
  type HostingUnitStatus,
} from "./hosting-model.ts";

export type Queryable = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

const CATALOGUE_UNITS = PILOT_SEED.villas.map((villa) => villa.id);
const VILLA_IDS = new Set(CATALOGUE_UNITS);

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

export function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "23505") return true;
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("duplicate key") || message.includes("hosting_relationships_one_active_primary");
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

/**
 * PROTOTYPE ASSUMPTION: T01–T12 already name a catalogue host (host-an and the
 * other pilot host ids). Those ids are recorded as the active Primary so the
 * database invariant applies. They are not villa-scoped HOST grants. Legacy
 * person-id grants stay as they are. valid_from is fixed because the seed has
 * no relationship start time.
 */
export async function ensureCataloguePrimaries(db: Queryable): Promise<void> {
  for (const villa of PILOT_SEED.villas) {
    if (villa.published === false || !villa.hostId) continue;
    try {
      await db.query(
        `insert into hosting_relationships (id, unit_id, identity_id, kind, valid_from)
         select $1, $2, $3, 'PRIMARY', timestamptz '2026-01-01T00:00:00Z'
         where not exists (
           select 1 from hosting_relationships
           where unit_id = $2 and kind = 'PRIMARY' and valid_to is null
         )`,
        [`rel_catalogue_${villa.id}`, villa.id, villa.hostId],
      );
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
}

/**
 * The only way to create a villa-scoped HOST grant.
 * Relationship and grant are written by the caller inside one transaction.
 *
 * The standard V0 Primary Host set is this villa-scoped HOST grant only.
 * HOST_DAMAGE is the prototype grant for the spec phrase
 * "villa-scoped Host damage-resolution authority (ADR-P073)" and is not granted here.
 * SALE, BUTLER, BQL and ADMIN are not granted here.
 */
export async function establishPrimaryHost(
  db: Queryable,
  input: { unitId: string; identityId: string; grantedBy: string },
): Promise<{ relationshipId: string; grantId: string }> {
  if (!VILLA_IDS.has(input.unitId)) throw new Error("Villa không có trong danh sách");
  const relationshipId = newId("rel");
  const grantId = newId("grant");
  try {
    const inserted = await db.query<{ id: string }>(
      `insert into hosting_relationships (id, unit_id, identity_id, kind, valid_from)
       select $1, $2, $3, 'PRIMARY', now()
       where not exists (
         select 1 from hosting_relationships
         where unit_id = $2 and kind = 'PRIMARY' and valid_to is null
       )
       returning id`,
      [relationshipId, input.unitId, input.identityId],
    );
    if (!inserted[0]) throw new PrimaryOccupiedError(input.unitId);
  } catch (err) {
    if (err instanceof PrimaryOccupiedError) throw err;
    if (isUniqueViolation(err)) throw new PrimaryOccupiedError(input.unitId);
    throw err;
  }

  const existing = await db.query<{ id: string }>(
    `select id from role_grants
     where user_id = $1 and role = 'HOST' and scope_ref = $2`,
    [input.identityId, input.unitId],
  );
  if (existing[0]) {
    await db.query(
      `update role_grants
       set status = 'active', granted_by = $2, granted_at = now()
       where id = $1`,
      [existing[0].id, input.grantedBy],
    );
    return { relationshipId, grantId: existing[0].id };
  }
  await db.query(
    `insert into role_grants (id, user_id, role, scope_ref, status, granted_by, granted_at)
     values ($1, $2, 'HOST', $3, 'active', $4, now())`,
    [grantId, input.identityId, input.unitId, input.grantedBy],
  );
  return { relationshipId, grantId };
}

/** Admin form and approved onboarding both call this. Catalogue primaries must already be committed. */
export async function grantVillaScopedHost(
  db: Queryable,
  input: { unitId: string; identityId: string; grantedBy: string },
): Promise<{ relationshipId: string; grantId: string }> {
  return establishPrimaryHost(db, input);
}

export async function endHostingRelationship(
  db: Queryable,
  input: { relationshipId: string; endedBy: string },
): Promise<void> {
  const rows = await db.query<{ unit_id: string; identity_id: string }>(
    `select unit_id, identity_id
     from hosting_relationships
     where id = $1 and kind = 'PRIMARY' and valid_to is null`,
    [input.relationshipId],
  );
  const row = rows[0];
  if (!row) throw new Error("Không có quan hệ chủ nhà chính đang hiệu lực");
  await db.query(
    `update hosting_relationships set valid_to = now() where id = $1 and valid_to is null`,
    [input.relationshipId],
  );
  await db.query(
    `update role_grants
     set status = 'revoked', granted_by = $3, granted_at = now()
     where user_id = $1
       and scope_ref = $2
       and status = 'active'
       and role in ('HOST', 'HOST_DAMAGE')`,
    [row.identity_id, row.unit_id, input.endedBy],
  );
}

export async function activePrimaryFor(
  db: Queryable,
  unitId: string,
): Promise<{ id: string; identityId: string } | null> {
  const rows = await db.query<{ id: string; identity_id: string }>(
    `select id, identity_id from hosting_relationships
     where unit_id = $1 and kind = 'PRIMARY' and valid_to is null`,
    [unitId],
  );
  const row = rows[0];
  return row ? { id: row.id, identityId: row.identity_id } : null;
}

export async function createHostingRequest(
  db: Queryable,
  input: ContactFields & {
    applicantUserId: string;
    unitIds: readonly string[];
    requestId?: string;
  },
): Promise<{ requestId: string; unitIds: string[] }> {
  const contact = assertHostingContact(input);
  const unitIds = planHostingUnits(input.unitIds, CATALOGUE_UNITS);
  const requestId = input.requestId ?? newId("hreq");
  await db.query(
    `insert into hosting_requests (
       id, applicant_user_id, destination_id, contact_name, contact_email, contact_phone
     ) values ($1, $2, $3, $4, $5, $6)`,
    [
      requestId,
      input.applicantUserId,
      OCEANAMI_DESTINATION_ID,
      contact.contactName,
      contact.contactEmail,
      contact.contactPhone,
    ],
  );
  for (const unitId of unitIds) {
    await db.query(
      `insert into hosting_request_units (id, request_id, unit_id, status)
       values ($1, $2, $3, 'PENDING')`,
      [newId("hunit"), requestId, unitId],
    );
  }
  return { requestId, unitIds };
}

type UnitRow = {
  id: string;
  request_id: string;
  applicant_user_id: string;
  destination_id: string;
  created_at: string | Date;
  unit_id: string;
  status: HostingUnitStatus;
  reason: string | null;
};

type AdminRow = UnitRow & {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  actor: string | null;
  decided_at: string | Date | null;
  basis: string | null;
};

export async function listApplicantHostingRequests(
  db: Queryable,
  applicantUserId: string,
): Promise<ApplicantRequestView[]> {
  const rows = await db.query<UnitRow>(
    `select u.id, u.request_id, r.applicant_user_id, r.destination_id, r.created_at,
            u.unit_id, u.status, u.reason
     from hosting_request_units u
     join hosting_requests r on r.id = u.request_id
     where r.applicant_user_id = $1
     order by r.created_at, u.unit_id`,
    [applicantUserId],
  );
  const grouped = new Map<string, ApplicantRequestView & { applicantUserId: string }>();
  for (const row of rows) {
    const current = grouped.get(row.request_id) ?? {
      requestId: row.request_id,
      applicantUserId: row.applicant_user_id,
      destinationId: row.destination_id,
      createdAt: iso(row.created_at),
      units: [],
    };
    current.units.push({
      id: row.id,
      unitId: row.unit_id,
      status: row.status,
      reason: row.reason,
    });
    grouped.set(row.request_id, current);
  }
  return applicantRequestsFrom([...grouped.values()], applicantUserId);
}

export async function listAdminHostingQueue(db: Queryable): Promise<AdminRequestView[]> {
  const rows = await db.query<AdminRow>(
    `select r.id as request_id, r.applicant_user_id, r.destination_id,
            r.contact_name, r.contact_email, r.contact_phone, r.created_at,
            u.id, u.unit_id, u.status, u.reason, u.actor, u.decided_at, u.basis
     from hosting_requests r
     join hosting_request_units u on u.request_id = r.id
     where exists (
       select 1 from hosting_request_units pending
       where pending.request_id = r.id and pending.status = 'PENDING'
     )
     order by r.created_at, u.unit_id`,
  );
  const grouped = new Map<string, AdminRequestView>();
  for (const row of rows) {
    const unit: AdminUnitView = {
      id: row.id,
      unitId: row.unit_id,
      status: row.status,
      reason: row.reason,
      actor: row.actor,
      decidedAt: row.decided_at ? iso(row.decided_at) : null,
      basis: row.basis,
    };
    const current = grouped.get(row.request_id);
    if (current) {
      current.units.push(unit);
      continue;
    }
    grouped.set(row.request_id, {
      requestId: row.request_id,
      applicantUserId: row.applicant_user_id,
      destinationId: row.destination_id,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      createdAt: iso(row.created_at),
      units: [unit],
    });
  }
  return [...grouped.values()];
}

export async function decideHostingUnit(
  db: Queryable,
  input: {
    unitRowId: string;
    outcome: "APPROVED" | "REJECTED";
    reason: string;
    actor?: string;
  },
): Promise<{ status: HostingUnitStatus; unitId: string }> {
  const reason = input.reason.trim();
  if (!reason) throw new Error("Cần một lý do ngắn");
  if (input.outcome !== "APPROVED" && input.outcome !== "REJECTED") {
    throw new Error("Kết quả không hợp lệ");
  }
  const actor = input.actor ?? HOSTING_ADMIN_ACTOR;
  const rows = await db.query<{
    id: string;
    status: HostingUnitStatus;
    unit_id: string;
    applicant_user_id: string;
  }>(
    `select u.id, u.status, u.unit_id, r.applicant_user_id
     from hosting_request_units u
     join hosting_requests r on r.id = u.request_id
     where u.id = $1
     for update`,
    [input.unitRowId],
  );
  const row = rows[0];
  if (!row) throw new Error("Không thấy yêu cầu này");
  if (row.status !== "PENDING") throw new Error("Đơn vị này đã được xử lý");

  if (input.outcome === "APPROVED") {
    await establishPrimaryHost(db, {
      unitId: row.unit_id,
      identityId: row.applicant_user_id,
      grantedBy: actor,
    });
  }

  await db.query(
    `update hosting_request_units
     set status = $2, actor = $3, decided_at = now(), basis = $4, reason = $5
     where id = $1 and status = 'PENDING'`,
    [row.id, input.outcome, actor, HOSTING_VERIFICATION_BASIS, reason],
  );
  return { status: input.outcome, unitId: row.unit_id };
}

export async function grantsForIdentity(
  db: Queryable,
  identityId: string,
): Promise<{ role: string; scopeRef: string | null; status: string }[]> {
  return db.query(
    `select role, scope_ref as "scopeRef", status
     from role_grants where user_id = $1 order by role, scope_ref`,
    [identityId],
  );
}

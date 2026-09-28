import { authorizeRole } from "./authorize.ts";
import { withTransaction } from "./db.ts";
import { currentDevUser } from "./dev-identity.server.ts";
import {
  createHostingRequest,
  decideHostingUnit,
  ensureCataloguePrimaries,
  listAdminHostingQueue,
  listApplicantHostingRequests,
} from "./hosting.ts";
import type { AdminRequestView, ApplicantRequestView, ContactFields } from "./hosting-model.ts";

function assertOperator(key: string | null | undefined): void {
  if (authorizeRole("admin", key).persona !== "ADMIN") {
    throw new Error("Chỉ Stayora vận hành được xử lý yêu cầu này");
  }
}

export async function submitHostingRequest(
  input: ContactFields & { unitIds: readonly string[] },
): Promise<{ requestId: string }> {
  const user = await currentDevUser();
  if (!user) throw new Error("Đăng nhập để gửi yêu cầu");
  return withTransaction(async (sql) => {
    const created = await createHostingRequest(sql, {
      applicantUserId: user.id,
      unitIds: input.unitIds,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    });
    return { requestId: created.requestId };
  });
}

export async function myHostingRequests(): Promise<ApplicantRequestView[]> {
  const user = await currentDevUser();
  if (!user) throw new Error("Đăng nhập để xem yêu cầu");
  return withTransaction((sql) => listApplicantHostingRequests(sql, user.id));
}

export async function adminHostingQueue(key?: string | null): Promise<AdminRequestView[]> {
  assertOperator(key);
  return withTransaction((sql) => listAdminHostingQueue(sql));
}

export async function adminDecideHostingUnit(input: {
  unitRowId: string;
  outcome: "APPROVED" | "REJECTED";
  reason: string;
  key?: string | null;
}): Promise<{ status: string; unitId: string }> {
  assertOperator(input.key);
  await withTransaction((sql) => ensureCataloguePrimaries(sql));
  return withTransaction((sql) =>
    decideHostingUnit(sql, {
      unitRowId: input.unitRowId,
      outcome: input.outcome,
      reason: input.reason,
    }),
  );
}

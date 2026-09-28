import { assertVillaSelection } from "./grant-scope.ts";

/**
 * PROTOTYPE ASSUMPTION: the spec names the destination Oceanami but does not
 * assign a destinationId token. While only Oceanami exists the selector stays
 * hidden and every request stores this id.
 */
export const OCEANAMI_DESTINATION_ID = "oceanami";

/**
 * PROTOTYPE ASSUMPTION: this baseline has no real Admin identity, only
 * ADMIN_KEY. Approving and rejecting records this actor label.
 */
export const HOSTING_ADMIN_ACTOR = "Stayora vận hành (admin key)";

/** Verification basis is fixed. The operator cannot choose another. */
export const HOSTING_VERIFICATION_BASIS = "Admin-assisted";

export const HOSTING_UNIT_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type HostingUnitStatus = (typeof HOSTING_UNIT_STATUSES)[number];

/** Belongs to the requested unit, never to the account. */
export const PENDING_UNIT_COPY = "Đang chờ Stayora xác nhận";

export function primaryOccupiedReason(unitId: string): string {
  return `Villa ${unitId} đã có chủ nhà chính. Không lập thêm chủ nhà chính.`;
}

export class PrimaryOccupiedError extends Error {
  readonly unitId: string;
  constructor(unitId: string) {
    super(primaryOccupiedReason(unitId));
    this.name = "PrimaryOccupiedError";
    this.unitId = unitId;
  }
}

export type ContactFields = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

/**
 * PROTOTYPE ASSUMPTION: the spec requires a phone and does not define a
 * format. Any non-empty trimmed string is accepted.
 */
export function assertHostingContact(input: ContactFields): ContactFields {
  const contactName = input.contactName.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();
  const contactPhone = input.contactPhone.trim();
  if (!contactName) throw new Error("Cần tên liên hệ");
  if (!contactEmail.includes("@")) throw new Error("Cần email liên hệ");
  if (!contactPhone) throw new Error("Cần số điện thoại");
  return { contactName, contactEmail, contactPhone };
}

export function planHostingUnits(
  unitIds: readonly string[] | undefined,
  knownUnitIds: readonly string[],
): string[] {
  return assertVillaSelection(unitIds, knownUnitIds);
}

export type ApplicantUnitView = {
  id: string;
  unitId: string;
  status: HostingUnitStatus;
  reason: string | null;
};

export type ApplicantRequestView = {
  requestId: string;
  destinationId: string;
  createdAt: string;
  units: ApplicantUnitView[];
};

export type AdminUnitView = ApplicantUnitView & {
  actor: string | null;
  decidedAt: string | null;
  basis: string | null;
};

export type AdminRequestView = {
  requestId: string;
  applicantUserId: string;
  destinationId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  units: AdminUnitView[];
};

/** Applicant payload. Contact fields are not on this type and must not be copied in. */
export function applicantRequestsFrom(
  requests: readonly {
    requestId: string;
    applicantUserId: string;
    destinationId: string;
    createdAt: string;
    units: ApplicantUnitView[];
  }[],
  applicantUserId: string,
): ApplicantRequestView[] {
  return requests
    .filter((request) => request.applicantUserId === applicantUserId)
    .map((request) => ({
      requestId: request.requestId,
      destinationId: request.destinationId,
      createdAt: request.createdAt,
      units: request.units.map((unit) => ({
        id: unit.id,
        unitId: unit.unitId,
        status: unit.status,
        reason: unit.reason,
      })),
    }));
}

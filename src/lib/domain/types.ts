import type { NON_OCCURRENCE_REASONS } from "./config.ts";

export type NonOccurrenceReason = (typeof NON_OCCURRENCE_REASONS)[number];

export type Persona = "GUEST" | "SALE" | "HOST" | "BUTLER" | "BQL" | "ADMIN";

export type Actor =
  | { persona: "GUEST" }
  | { persona: "SALE"; saleId: string }
  | { persona: "HOST" }
  | { persona: "BUTLER"; butlerId: string; assignedVillaIds?: readonly string[] }
  | { persona: "BQL" }
  | { persona: "ADMIN" };

export type RequestSource = "GUEST" | "SALE";

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CONFLICTED";

export type StayStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "COMPLETED"
  | "DID_NOT_OCCUR"
  | "CANCELLED";

export type StayOrigin = "STAYORA" | "EXTERNAL";

export type CommitmentKind = "HOLD" | "CONFIRMED_ACCOMMODATION" | "AVAILABILITY_BLOCK";

export type CommitmentStatus = "ACTIVE" | "ENDED";

export type EndedReason = "EXPIRED" | "SUPERSEDED" | "RELEASED";

export type CommitmentBasis = "STAYORA_BOOKING" | "EXTERNAL" | "BLOCK";

export type BlockKind = "OWNER" | "MAINTENANCE";

export type CommissionStatus = "PENDING" | "EARNED" | "VOID";

export type PaymentOutcome = "SUCCEEDED" | "FAILED" | "UNKNOWN";

export type ExternalSource = "Airbnb" | "Booking.com" | "Agoda" | "Zalo" | "Khách quen" | "Khác";

export type RefundReason =
  | "HOLD_EXPIRED"
  | "DUPLICATE_PAYMENT"
  | "INVENTORY_CONFLICT"
  | "CONFLICT_RESOLUTION"
  | "BOOKING_CANCELLED";

export type StayRequest = {
  id: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  nightly: number;
  nights: number;
  total: number;
  source: RequestSource;
  saleId?: string;
  status: RequestStatus;
  createdAt: string;
  acceptedAt?: string;
  holdExpiresAt?: string;
  declinedAt?: string;
  expiredAt?: string;
  conflictedAt?: string;
};

export type Booking = {
  id: string;
  requestId: string;
  stayId: string;
  villaId: string;
  reference: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  nightly: number;
  nights: number;
  total: number;
  saleId?: string;
  status: "CONFIRMED" | "CANCELLED";
  confirmedAt: string;
  cancelledAt?: string;
};

export type Stay = {
  id: string;
  bookingId?: string;
  requestId?: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  origin: StayOrigin;
  originLabel: string;
  status: StayStatus;
  assignedButlerId?: string;
  didNotOccurReason?: NonOccurrenceReason;
  preparedAt?: string;
  arrivalObservedAt?: string;
  departureObservedAt?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  completedAt?: string;
  didNotOccurAt?: string;
};

export type Commitment = {
  id: string;
  villaId: string;
  start: string;
  end: string;
  kind: CommitmentKind;
  status: CommitmentStatus;
  endedReason?: EndedReason;
  expiresAt?: string;
  basis: CommitmentBasis;
  blockKind?: BlockKind;
  requestId?: string;
  bookingId?: string;
  stayId?: string;
  externalId?: string;
  source?: ExternalSource;
  note?: string;
  reference?: string;
  createdBy?: Persona;
  createdAt?: string;
};

export type PaymentObligation = {
  id: string;
  requestId: string;
  kind: "INITIAL" | "BALANCE";
  amount: number;
  dueAt: string;
};

export type PaymentAttempt = {
  id: string;
  obligationId: string;
  status: PaymentOutcome;
  at: string;
};

export type RefundCase = {
  id: string;
  requestId: string;
  attemptId?: string;
  amount: number;
  reason: RefundReason;
  status: "OPEN" | "DONE";
  createdAt: string;
  note?: string;
  resolvedAt?: string;
};

export type ExternalReport = {
  id: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName?: string;
  source: ExternalSource;
  note?: string;
  reportedBy: "SALE" | "BUTLER";
  reporterId?: string;
  createdAt: string;
  /** Set when a Fact is recorded from this report. The report stays. */
  factId?: string;
};

export type ExternalAccommodation = {
  id: string;
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName?: string;
  source: ExternalSource;
  /** The report this Fact came from, when there was one. */
  reportId?: string;
  recordedAt?: string;
  /** Set only when an External-backed Commitment exists. */
  commitmentId?: string;
};

export type InventoryConflict = {
  id: string;
  villaId: string;
  commitmentIds: string[];
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  resolvedAt?: string;
  keepCommitmentId?: string;
  endCommitmentId?: string;
  reason?: string;
};

export type AuditEntry = {
  id: string;
  at: string;
  persona: Persona;
  action: string;
  objectId: string;
  reason?: string;
};

export type Incident = {
  id: string;
  stayId: string;
  villaId: string;
  note: string;
  hasPhoto: boolean;
  createdAt: string;
  createdBy: Persona;
};

/** Availability block that is not an inventory commitment. ADR-P067. */
export type ProtectiveHold = {
  id: string;
  villaId: string;
  start: string;
  end: string;
  incidentId?: string;
  note: string;
  status: "ACTIVE" | "ENDED";
  createdAt: string;
  createdBy: Persona;
  reviewDueAt: string;
  endedAt?: string;
  endedAs?: "RELEASED" | "MAINTENANCE";
};

export type Commission = {
  id: string;
  bookingId: string;
  stayId: string;
  saleId: string;
  amount: number;
  status: CommissionStatus;
};

export type Person = {
  id: string;
  name: string;
  villaIds?: string[];
};

export type World = {
  now: string;
  requests: StayRequest[];
  bookings: Booking[];
  stays: Stay[];
  commitments: Commitment[];
  incidents: Incident[];
  commissions: Commission[];
  obligations: PaymentObligation[];
  attempts: PaymentAttempt[];
  refundCases: RefundCase[];
  conflicts: InventoryConflict[];
  protectiveHolds: ProtectiveHold[];
  auditLog: AuditEntry[];
  externalAccommodations: ExternalAccommodation[];
  externalReports: ExternalReport[];
  sales: Person[];
  butlers: Person[];
};

export class DomainError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

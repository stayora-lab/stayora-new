export type Persona = "GUEST" | "SALE" | "HOST" | "BUTLER" | "BQL";

export type Actor =
  | { persona: "GUEST" }
  | { persona: "SALE"; saleId: string }
  | { persona: "HOST" }
  | { persona: "BUTLER"; butlerId: string }
  | { persona: "BQL" };

export type PaymentRule = "FIFTY_FIFTY" | "FULL";

export type RequestSource = "GUEST" | "SALE";

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONFIRMED"
  | "DECLINED"
  | "EXPIRED";

export type StayStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "COMPLETED"
  | "DID_NOT_OCCUR";

export type StayOrigin = "STAYORA" | "EXTERNAL";

export type CommitmentKind = "HOLD" | "CONFIRMED_ACCOMMODATION";

export type CommissionStatus = "PENDING" | "EARNED";

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
  paymentRule: PaymentRule;
  source: RequestSource;
  saleId?: string;
  status: RequestStatus;
  createdAt: string;
  acceptedAt?: string;
  holdExpiresAt?: string;
  confirmedAt?: string;
  declinedAt?: string;
  reference?: string;
  bookingId?: string;
  stayId?: string;
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
  paymentRule: PaymentRule;
  saleId?: string;
  status: "CONFIRMED";
  confirmedAt: string;
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
  didNotOccurReason?: string;
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
  requestId?: string;
  bookingId?: string;
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

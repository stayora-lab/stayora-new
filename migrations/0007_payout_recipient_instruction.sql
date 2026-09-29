-- ADR-P076. A payout-recipient instruction, not a payment.
-- One pending choice per designation, for the whole attributable cohort.
-- Only RETAIN becomes a durable row, and only when the transfer becomes
-- effective. FOLLOW INCOMING and silence insert nothing. No fund movement,
-- settlement, deduction, or beneficiary column.

create table if not exists transfer_payout_choices (
  designation_id text primary key references primary_designations (id),
  choice text not null,
  set_by text not null,
  set_at timestamptz not null default now(),
  constraint transfer_payout_choices_choice_chk
    check (choice in ('RETAIN', 'FOLLOW_INCOMING'))
);

create table if not exists payout_recipient_instructions (
  booking_id text primary key,
  unit_id text not null,
  direction text not null,
  retained_identity_id text not null,
  transfer_ref text not null,
  set_by text not null,
  basis text not null,
  created_at timestamptz not null default now(),
  constraint payout_recipient_instructions_direction_chk
    check (direction = 'RETAIN')
);

create index if not exists payout_recipient_instructions_unit_idx
  on payout_recipient_instructions (unit_id);

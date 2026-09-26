/**
 * DEMO ASSUMPTION pending Founder decision: the hold keeps running during UNKNOWN.
 * Also the placeholder duration for a Temporary Exclusive Commitment. The
 * duration itself is TBD (open policy item 13). Not policy.
 */
export const HOLD_MS = 30 * 60 * 1000;

/**
 * Oceanami pilot Host-response window while a Request is PENDING.
 * ADR-P071. The number is destination configuration
 * (13-destination-operations/oceanami/configuration.md), not a global constant.
 */
export const HOST_RESPONSE_MS = 24 * 60 * 60 * 1000;

/**
 * PROTOTYPE ASSUMPTION (G-v2.4, ADR-P071):
 * The near-Check-in threshold and the shortened Host-response window are TBD
 * in oceanami/configuration.md. This prototype treats Check-in within 48 hours
 * as near, and shortens the Host-response window to 2 hours. The deadline
 * still never passes Check-in. A request recorded after Check-in has already
 * passed gets no clock — that is how the seed shows a stay already underway,
 * not a way to extend a live deadline. Not policy.
 */
export const NEAR_CHECK_IN_MS = 48 * 60 * 60 * 1000;
export const NEAR_CHECK_IN_RESPONSE_MS = 2 * 60 * 60 * 1000;

/**
 * PROTOTYPE ASSUMPTION (G-v2.4, ADR-P071):
 * The acceptance / confirmation-response window is TBD. This prototype uses
 * 30 minutes, the same placeholder as HOLD_MS. It is a separate clock from
 * the PENDING Host-response window. Not policy.
 */
export const ACCEPTANCE_RESPONSE_MS = HOLD_MS;

export const COMMISSION_RATE = 0.1;
export const PILOT_NOW = "2026-09-22T03:00:00.000Z";
export const PILOT_TODAY = "2026-09-22";

/** DEMO ASSUMPTION */
export const CHECK_IN_TIME = "14:00";

/** DEMO ASSUMPTION */
export const TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * PROTOTYPE ASSUMPTION (G-v2.1, coverage row 8):
 * FD-02 / FD-04 complete a CHECKED_OUT stay when no Stay-lifecycle blocker
 * exists. Which exceptions count as that blocker is still policy-bound and
 * is not decided here. Open Incident is not a blocker. This prototype records
 * checkout as CHECKED_OUT, then runs evaluation with an empty blocker set, so
 * completion follows immediately and stays a separate fact.
 * Product Architect disposition, recorded only: row 8 stays PARTIAL and
 * non-blocking. Do not invent a blocker catalogue to force a PASS.
 */
export const COMPLETION_BLOCKERS_DECIDED = false;

/**
 * PROTOTYPE ASSUMPTION (ADR-P072):
 * Freshness decay — READY becomes DIRTY when no guest is present — is
 * confirmed as a rule. The Oceanami duration is TBD in
 * 13-destination-operations/oceanami/configuration.md. This prototype uses
 * 7 days. Not policy.
 */
export const VILLA_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * PROTOTYPE ASSUMPTION (G-v2.2, FD-16):
 * Review/expiry duration for an Emergency Protective Hold is undecided.
 * This prototype uses 24 hours. When that moment passes the hold stays in
 * place and the villa still needs attention. It is not released by the clock.
 * Not policy.
 */
export const PROTECTIVE_HOLD_REVIEW_MS = 24 * 60 * 60 * 1000;

/**
 * PROTOTYPE ASSUMPTION (G-v2.2, FD-15):
 * Who may place or release a protective hold is undecided.
 * This prototype lets BQL place and release one on any villa, and the Host of
 * that villa place and release one on it. A Butler may report what happened
 * but may not place the hold. Recording maintenance stays with the Host, who
 * already could. Not a grant decision.
 */
export const PROTECTIVE_HOLD_ACTORS = "bql-and-host-of-villa";

/**
 * ADR-P066. A scheduled Stay that did not take place needs one of these.
 * Not a prototype stand-in for an open policy.
 */
export const NON_OCCURRENCE_REASONS = [
  "BOOKING_CANCELLED",
  "NO_SHOW",
  "OTHER_AUTHORIZED_REASON",
] as const;

/**
 * PROTOTYPE ASSUMPTION (G-v2.3, FD-12):
 * Who holds External Accommodation Recording Authority is not granted.
 * This prototype lets the Host record a Fact. Sale and the assigned Butler
 * may only submit a report. A report never becomes a Fact by itself.
 * Not a grant decision.
 */
export const EXTERNAL_RECORDING_ACTOR = "host";

/**
 * PROTOTYPE ASSUMPTION (G-v2.3, coverage row 14):
 * When a recorded Fact must become an External-backed Commitment is not decided.
 * This prototype lets the Host establish that commitment later, or in the same
 * action as recording the Fact. A Fact with no commitment does not hold the
 * calendar. Not policy.
 */
export const EXTERNAL_COMMITMENT_TIMING = "host-may-wait";

/**
 * PROTOTYPE ASSUMPTION (G-v2.3, ADR-P066):
 * Who may record that a scheduled Stay did not take place is not named.
 * This prototype keeps the assigned Butler, and requires one of
 * NON_OCCURRENCE_REASONS. Cancelling a Booking does not write the Stay.
 * Not a grant decision.
 */
export const NON_OCCURRENCE_ACTOR = "assigned-butler";


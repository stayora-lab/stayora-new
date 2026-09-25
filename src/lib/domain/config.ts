/**
 * DEMO ASSUMPTION pending Founder decision: the hold keeps running during UNKNOWN.
 */
export const HOLD_MS = 30 * 60 * 1000;

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
 * PROTOTYPE ASSUMPTION (G-v2.1):
 * "Cần chuẩn bị" means an assigned stay whose arrival date is the board day
 * and that has not been marked prepared. The spec does not decide the
 * preparation window.
 */
export const PREPARE_WINDOW = "arrival-day-only";

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

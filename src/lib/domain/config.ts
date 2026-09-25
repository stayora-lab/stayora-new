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
 */
export const COMPLETION_BLOCKERS_DECIDED = false;

/**
 * PROTOTYPE ASSUMPTION (G-v2.1):
 * "Cần chuẩn bị" means an assigned stay whose arrival date is the board day
 * and that has not been marked prepared. The spec does not decide the
 * preparation window.
 */
export const PREPARE_WINDOW = "arrival-day-only";

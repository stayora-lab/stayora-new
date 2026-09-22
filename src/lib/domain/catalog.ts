import { differenceInCalendarDays, parseISO } from "date-fns";
import { getVilla, villas } from "../villas.ts";
import { CHECK_IN_TIME, TIMEZONE } from "./config.ts";
import type { PaymentObligation } from "./types.ts";

export const SALE_MAI = "sale-mai";
export const BUTLER_LINH = "butler-linh";

export type PaymentPlanLine = Pick<PaymentObligation, "kind" | "amount" | "dueAt">;

const OFFSET_BY_ZONE: Record<string, string> = {
  "Asia/Ho_Chi_Minh": "+07:00",
};

export function checkInInstant(checkIn: string): Date {
  const offset = OFFSET_BY_ZONE[TIMEZONE] ?? "+07:00";
  return new Date(`${checkIn}T${CHECK_IN_TIME}:00${offset}`);
}

/** DEMO ASSUMPTION: evaluatedAt is Request.createdAt. */
export function paymentPlan(
  total: number,
  checkIn: string,
  evaluatedAt: string,
): PaymentPlanLine[] {
  const checkInMs = checkInInstant(checkIn).getTime();
  const evaluatedMs = parseISO(evaluatedAt).getTime();
  const moreThan24h = checkInMs - evaluatedMs > 24 * 60 * 60 * 1000;
  if (moreThan24h) {
    const initial = Math.round(total / 2);
    return [
      { kind: "INITIAL", amount: initial, dueAt: evaluatedAt },
      {
        kind: "BALANCE",
        amount: total - initial,
        dueAt: new Date(checkInMs - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
  return [{ kind: "INITIAL", amount: total, dueAt: evaluatedAt }];
}

export function paymentPlanLabel(total: number, checkIn: string, evaluatedAt: string): string {
  return paymentPlan(total, checkIn, evaluatedAt).length === 2 ? "50/50" : "100%";
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

export function requireVilla(villaId: string) {
  const villa = getVilla(villaId);
  if (!villa) throw new Error(`Unknown villa ${villaId}`);
  return villa;
}

export { villas, getVilla };

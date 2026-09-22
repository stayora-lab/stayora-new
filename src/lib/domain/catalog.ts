import { getVilla, villas } from "../villas.ts";
import type { PaymentRule } from "./types.ts";

export const SALE_MAI = "sale-mai";
export const BUTLER_LINH = "butler-linh";
export const HOLD_MS = 24 * 60 * 60 * 1000;
export const COMMISSION_RATE = 0.1;
export const PILOT_NOW = "2026-09-22T03:00:00.000Z";
export const PILOT_TODAY = "2026-09-22";

export const PAYMENT_RULE: Record<string, PaymentRule> = {
  "sao-bien": "FIFTY_FIFTY",
  "huong-tram": "FULL",
  "minh-dam": "FIFTY_FIFTY",
  "sen-hong": "FULL",
  "gio-bien": "FIFTY_FIFTY",
  "cat-vang": "FIFTY_FIFTY",
};

export function paymentRuleOf(villaId: string): PaymentRule {
  return PAYMENT_RULE[villaId] ?? "FULL";
}

export function paymentRuleLabel(rule: PaymentRule): string {
  return rule === "FIFTY_FIFTY" ? "50/50" : "100%";
}

export function requireVilla(villaId: string) {
  const villa = getVilla(villaId);
  if (!villa) throw new Error(`Unknown villa ${villaId}`);
  return villa;
}

export { villas, getVilla };

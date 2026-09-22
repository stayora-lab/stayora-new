import {
  addDays,
  differenceInCalendarDays,
  format,
  isAfter,
  parseISO,
  startOfDay,
} from "date-fns";
import { isAvailable, occupiedRanges, type World } from "@/lib/domain";
import type { Villa } from "@/lib/villas";

export const DEFAULT_CHECK_IN = "2026-10-16";
export const DEFAULT_CHECK_OUT = "2026-10-19";
export const DEFAULT_GUESTS = 4;

export type StaySearch = {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

export type Bookability =
  | { state: "ready" }
  | { state: "missing-dates" }
  | { state: "unavailable" }
  | { state: "too-many-guests"; sleeps: number };

export function parseStaySearch(search: Record<string, unknown>): StaySearch {
  const checkIn = typeof search.checkIn === "string" ? search.checkIn : undefined;
  const checkOut = typeof search.checkOut === "string" ? search.checkOut : undefined;
  const rawGuests = Number(search.guests);
  const guests =
    Number.isInteger(rawGuests) && rawGuests >= 1 && rawGuests <= 16
      ? rawGuests
      : undefined;
  return { checkIn, checkOut, guests };
}

export function isIsoDate(value: string | undefined): value is string {
  if (!value) return false;
  const date = parseISO(value);
  return !Number.isNaN(date.getTime()) && value.length >= 10;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

export function formatVnd(amount: number): string {
  return `₫${amount.toLocaleString("en-US")}`;
}

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "d MMM");
}

export function formatLongDate(iso: string): string {
  return format(parseISO(iso), "EEEE d MMMM yyyy");
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = parseISO(checkIn);
  const end = parseISO(checkOut);
  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d")}–${format(end, "d MMM yyyy")}`;
}

export function guestLabel(count: number): string {
  return count === 1 ? "1 guest" : `${count} guests`;
}

export function nightLabel(count: number): string {
  return count === 1 ? "1 night" : `${count} nights`;
}

export function bedroomLabel(count: number): string {
  return count === 1 ? "1 bedroom" : `${count} bedrooms`;
}

export function isRangeAvailable(
  villa: Villa,
  checkIn: string,
  checkOut: string,
  world?: World,
): boolean {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) return false;
  if (nightsBetween(checkIn, checkOut) < 1) return false;
  if (!world) return true;
  return isAvailable(world, villa.id, checkIn, checkOut);
}

export function bookability(
  villa: Villa,
  checkIn: string | undefined,
  checkOut: string | undefined,
  guests: number,
  world?: World,
): Bookability {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || nightsBetween(checkIn, checkOut) < 1) {
    return { state: "missing-dates" };
  }
  if (guests > villa.sleeps) {
    return { state: "too-many-guests", sleeps: villa.sleeps };
  }
  if (!isRangeAvailable(villa, checkIn, checkOut, world)) {
    return { state: "unavailable" };
  }
  return { state: "ready" };
}

export function bookabilityCopy(result: Bookability): string {
  switch (result.state) {
    case "ready":
      return "Available to request";
    case "missing-dates":
      return "Check dates";
    case "unavailable":
      return "Not available for these dates";
    case "too-many-guests":
      return `Sleeps up to ${result.sleeps}`;
  }
}

export function disabledMatchers(villa?: Villa, world?: World) {
  const today = startOfDay(new Date());
  const matchers: Array<{ before: Date } | { from: Date; to: Date }> = [
    { before: today },
  ];
  if (!villa || !world) return matchers;
  for (const block of occupiedRanges(world, villa.id)) {
    const from = parseISO(block.start);
    const to = addDays(parseISO(block.end), -1);
    if (isAfter(to, addDays(from, -1))) {
      matchers.push({ from, to });
    }
  }
  return matchers;
}

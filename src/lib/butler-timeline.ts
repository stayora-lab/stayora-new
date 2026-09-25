import { addDays, format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { butlerFieldBoard } from "./domain/index.ts";
import type { Stay, World } from "./domain/types.ts";

/** Days after today shown by scrolling, without opening a calendar. */
export const ROLLING_AHEAD = 4;

export type MoveLane = "prepare" | "arriving" | "departing";

export type TimelineHit = {
  date: string;
  stay: Stay;
  lane: MoveLane;
};

export function addIsoDays(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

export function dateFromStrip(today: string, which: "yesterday" | "today" | "tomorrow"): string {
  if (which === "yesterday") return addIsoDays(today, -1);
  if (which === "tomorrow") return addIsoDays(today, 1);
  return today;
}

/** No stored date means the page opened on today. */
export function viewedDate(today: string, picked: string | null): string {
  return picked ?? today;
}

export function dayRelation(
  today: string,
  date: string,
): "yesterday" | "today" | "tomorrow" | "other" {
  if (date === today) return "today";
  if (date === addIsoDays(today, -1)) return "yesterday";
  if (date === addIsoDays(today, 1)) return "tomorrow";
  return "other";
}

/** Today stays quiet. Any other day says so in a sentence a Butler cannot miss. */
export function viewedDayLabel(today: string, date: string): string {
  const relation = dayRelation(today, date);
  if (relation === "today") return "Hôm nay";
  if (relation === "yesterday") return "Đang xem: Hôm qua";
  if (relation === "tomorrow") return "Đang xem: Ngày mai";
  const pretty = format(parseISO(date), "EEEE d/M", { locale: vi });
  return `Đang xem: ${pretty}`;
}

export function relativeDayPhrase(today: string, date: string): string {
  const relation = dayRelation(today, date);
  if (relation === "tomorrow") return "ngày mai";
  if (relation === "yesterday") return "hôm qua";
  if (relation === "today") return "hôm nay";
  return format(parseISO(date), "d/M", { locale: vi });
}

export function boardIsEmpty(board: {
  prepare: readonly unknown[];
  arriving: readonly unknown[];
  departing: readonly unknown[];
  inHouse: readonly unknown[];
}): boolean {
  return (
    board.prepare.length + board.arriving.length + board.departing.length + board.inHouse.length ===
    0
  );
}

function dayMoves(world: World, villaIds: readonly string[], date: string): TimelineHit[] {
  const board = butlerFieldBoard(world, date, villaIds);
  const preparing = new Set(board.prepare.map((stay) => stay.id));
  const hits: TimelineHit[] = board.arriving.map((stay) => ({
    date,
    stay,
    lane: preparing.has(stay.id) ? "prepare" : "arriving",
  }));
  for (const stay of board.departing) hits.push({ date, stay, lane: "departing" });
  return hits;
}

/** Compact Cần chuẩn bị / Khách đến / Khách đi for the days after today. */
export function upcomingMoves(
  world: World,
  villaIds: readonly string[],
  today: string,
  days = ROLLING_AHEAD,
): TimelineHit[] {
  const hits: TimelineHit[] = [];
  for (let offset = 1; offset <= days; offset += 1) {
    hits.push(...dayMoves(world, villaIds, addIsoDays(today, offset)));
  }
  return hits;
}

/** The next arrival or departure after the day being viewed. Null if nothing is ahead. */
export function nextUpcoming(
  world: World,
  villaIds: readonly string[],
  fromDate: string,
  horizon = 21,
): TimelineHit | null {
  for (let offset = 1; offset <= horizon; offset += 1) {
    const hits = dayMoves(world, villaIds, addIsoDays(fromDate, offset));
    if (hits[0]) return hits[0];
  }
  return null;
}

export function emptyDayMessage(
  viewedIsToday: boolean,
  next: { villaName: string; arriving: boolean; when: string } | null,
): string {
  const head = viewedIsToday ? "Không có việc hôm nay." : "Không có việc ngày này.";
  if (!next) return head;
  const verb = next.arriving ? "khách đến" : "khách đi";
  return `${head} Việc gần nhất: ${next.villaName}, ${verb} ${next.when}.`;
}

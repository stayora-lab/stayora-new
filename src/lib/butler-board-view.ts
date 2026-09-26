import { format, parseISO } from "date-fns";
import { nextCardAction, type NextCardAction } from "./butler-card.ts";
import { addIsoDays } from "./butler-timeline.ts";
import { butlerFieldBoard, readinessOf } from "./domain/engine.ts";
import type { ProtectiveHold, Stay, VillaReadinessState, World } from "./domain/types.ts";

/**
 * PROTOTYPE ASSUMPTION
 * A Stay stores a date and no clock, so this board cannot know a guest's ETA.
 * Each villa is given a stable display window from its place in the assignment
 * list (Sáng / Chiều / Tối). That window is an ordering slot, not a recorded time.
 *
 * Operational colors are the existing tokens only — no new hex:
 *   needs prep        sand
 *   ready             moss   (also the button that marks the villa ready)
 *   in-house, quiet   muted
 *   blocked / incident lotus (plus a triangle, so it is not color alone)
 * Guest-move buttons use lotus, the existing action token.
 */

export const DISPLAY_WINDOWS = [
  { id: "morning", label: "Sáng" },
  { id: "afternoon", label: "Chiều" },
  { id: "evening", label: "Tối" },
] as const;

export type WindowId = (typeof DISPLAY_WINDOWS)[number]["id"];
export type Housekeeping = "needs-prep" | "ready" | "quiet" | "blocked";
export type GuestMark = "arrival" | "departure" | "in-house";
export type ActionTone = "moss" | "lotus";

export type CardEvent = {
  stayId: string;
  mark: GuestMark;
  guests: number;
};

export type CardAction =
  | { kind: "stay"; id: NextCardAction["id"]; label: string; tone: ActionTone; stayId: string }
  | { kind: "begin-cleaning"; label: string; tone: "moss"; villaId: string }
  | { kind: "complete-cleaning"; label: string; tone: "moss"; villaId: string }
  | { kind: "release-hold"; label: string; tone: "lotus"; holdId: string };

export type VillaCardModel = {
  villaId: string;
  order: number;
  window: WindowId;
  housekeeping: Housekeeping;
  needsPrep: boolean;
  events: CardEvent[];
  lateLabel: string | null;
  attentionNote: string | null;
  holdOverdue: boolean;
  readiness: VillaReadinessState;
  action: CardAction | null;
};

export type DayLayout = {
  pinned: VillaCardModel[];
  late: VillaCardModel[];
  windows: { id: WindowId; label: string; cards: VillaCardModel[] }[];
};

export type BoardFlags = { canAct: boolean; canHold: boolean };

const ACTION_PRIORITY: NextCardAction["id"][] = [
  "observe-departure",
  "check-out",
  "observe-arrival",
  "check-in",
];

export function windowForOrder(order: number): WindowId {
  const index = ((order % DISPLAY_WINDOWS.length) + DISPLAY_WINDOWS.length) % DISPLAY_WINDOWS.length;
  return DISPLAY_WINDOWS[index].id;
}

export function windowLabel(id: WindowId): string {
  return DISPLAY_WINDOWS.find((item) => item.id === id)?.label ?? id;
}

function orderOf(villaId: string, villaIds: readonly string[]): number {
  const index = villaIds.indexOf(villaId);
  return index === -1 ? villaIds.length : index;
}

function lateLabelFor(stay: Stay, today: string): string | null {
  const missed =
    stay.status === "SCHEDULED" && stay.checkIn < today
      ? stay.checkIn
      : stay.status === "CHECKED_IN" && stay.checkOut < today
        ? stay.checkOut
        : null;
  if (!missed) return null;
  if (missed === addIsoDays(today, -1)) return "Trễ từ hôm qua";
  return `Trễ từ ${format(parseISO(missed), "d/M")}`;
}

function holdApplies(hold: ProtectiveHold, date: string, today: string): boolean {
  if (hold.status !== "ACTIVE") return false;
  if (date >= hold.start && date < hold.end) return true;
  return date === today;
}

function attentionFor(world: World, villaId: string, date: string, today: string) {
  const notes: string[] = [];
  for (const incident of world.incidents) {
    if (incident.villaId === villaId) notes.push(incident.note);
  }
  const holds = (world.protectiveHolds ?? []).filter(
    (hold) => hold.villaId === villaId && holdApplies(hold, date, today),
  );
  for (const hold of holds) notes.push(hold.note);
  const overdue = holds.some((hold) => hold.reviewDueAt <= world.now);
  return {
    note: notes.length > 0 ? notes.join(" ") : null,
    hold: holds[0] ?? null,
    overdue,
  };
}

function stayAction(stay: Stay, date: string): NextCardAction | null {
  if (stay.status === "CHECKED_IN" && stay.checkOut <= date) return nextCardAction(stay, "departing");
  if (stay.status !== "SCHEDULED" || stay.checkIn > date) return null;
  return nextCardAction(stay, "arriving");
}

function chooseAction(
  stays: readonly Stay[],
  date: string,
  flags: BoardFlags,
  holdId: string | null,
  readiness: VillaReadinessState,
  villaId: string,
): CardAction | null {
  if (flags.canAct && readiness === "DIRTY") {
    return { kind: "begin-cleaning", label: "Bắt đầu dọn", tone: "moss", villaId };
  }
  if (flags.canAct && readiness === "CLEANING") {
    return { kind: "complete-cleaning", label: "Dọn xong", tone: "moss", villaId };
  }
  if (flags.canAct) {
    const ranked = stays
      .map((stay) => ({ stay, action: stayAction(stay, date) }))
      .filter((item): item is { stay: Stay; action: NextCardAction } => item.action !== null)
      .sort(
        (a, b) => ACTION_PRIORITY.indexOf(a.action.id) - ACTION_PRIORITY.indexOf(b.action.id),
      );
    const winner = ranked[0];
    if (winner) {
      return {
        kind: "stay",
        id: winner.action.id,
        label: winner.action.label,
        tone: "lotus",
        stayId: winner.stay.id,
      };
    }
  }
  if (flags.canHold && holdId) {
    return { kind: "release-hold", label: "Gỡ giữ bảo vệ", tone: "lotus", holdId };
  }
  return null;
}

function housekeepingOf(blocked: boolean, readiness: VillaReadinessState): Housekeeping {
  if (blocked) return "blocked";
  if (readiness === "READY") return "ready";
  return "needs-prep";
}

function markFor(stay: Stay, date: string): GuestMark {
  if (stay.status === "CHECKED_IN" && stay.checkOut <= date) return "departure";
  if (stay.status === "SCHEDULED" && stay.checkIn <= date) return "arrival";
  return "in-house";
}

type Bucket = {
  stays: Stay[];
  late: string | null;
};

function pushStay(map: Map<string, Bucket>, stay: Stay, late: string | null) {
  const bucket = map.get(stay.villaId) ?? { stays: [], late: null };
  if (!bucket.stays.some((item) => item.id === stay.id)) bucket.stays.push(stay);
  if (late) bucket.late = late;
  map.set(stay.villaId, bucket);
}

export function dayLayout(
  world: World,
  date: string,
  villaIds: readonly string[],
  today: string,
  flags: BoardFlags,
): DayLayout {
  const board = butlerFieldBoard(world, date, villaIds);
  const grouped = new Map<string, Bucket>();
  for (const stay of [...board.departing, ...board.arriving, ...board.inHouse]) {
    pushStay(grouped, stay, null);
  }
  if (date === today) {
    for (const stay of world.stays) {
      if (!villaIds.includes(stay.villaId)) continue;
      const late = lateLabelFor(stay, today);
      if (!late) continue;
      pushStay(grouped, stay, late);
    }
  }
  for (const villaId of villaIds) {
    const attention = attentionFor(world, villaId, date, today);
    if (!attention.note || grouped.has(villaId)) continue;
    grouped.set(villaId, { stays: [], late: null });
  }

  const cards: VillaCardModel[] = [];
  for (const [villaId, bucket] of grouped) {
    const order = orderOf(villaId, villaIds);
    const attention = attentionFor(world, villaId, date, today);
    const readiness = readinessOf(world, villaId).state;
    const needsPrep = readiness === "DIRTY" || readiness === "CLEANING";
    const rank = { departure: 0, arrival: 1, "in-house": 2 };
    const events = bucket.stays
      .map((stay) => ({ stayId: stay.id, mark: markFor(stay, date), guests: stay.guests }))
      .sort((a, b) => rank[a.mark] - rank[b.mark]);
    cards.push({
      villaId,
      order,
      window: windowForOrder(order),
      housekeeping: housekeepingOf(Boolean(attention.note), readiness),
      needsPrep,
      events,
      lateLabel: bucket.late,
      attentionNote: attention.note,
      holdOverdue: attention.overdue,
      readiness,
      action: chooseAction(bucket.stays, date, flags, attention.hold?.id ?? null, readiness, villaId),
    });
  }

  const byOrder = (a: VillaCardModel, b: VillaCardModel) => a.order - b.order;
  const pinned = cards.filter((card) => card.attentionNote).sort(byOrder);
  const late = cards.filter((card) => !card.attentionNote && card.lateLabel).sort(byOrder);
  const windows = DISPLAY_WINDOWS.map((window) => ({
    id: window.id,
    label: window.label,
    cards: cards
      .filter((card) => !card.attentionNote && !card.lateLabel && card.window === window.id)
      .sort(byOrder),
  })).filter((window) => window.cards.length > 0);

  return { pinned, late, windows };
}

export function cardOrder(layout: DayLayout): string[] {
  return [
    ...layout.pinned,
    ...layout.late,
    ...layout.windows.flatMap((window) => window.cards),
  ].map((card) => card.villaId);
}

export function findCard(layout: DayLayout, villaId: string): VillaCardModel | undefined {
  return [...layout.pinned, ...layout.late, ...layout.windows.flatMap((window) => window.cards)].find(
    (card) => card.villaId === villaId,
  );
}

/** Actionable cards only. A quiet in-house villa with nothing to do does not count. */
export function workload(layout: DayLayout): number {
  const cards = [
    ...layout.pinned,
    ...layout.late,
    ...layout.windows.flatMap((window) => window.cards),
  ];
  return cards.filter((card) => card.action || card.attentionNote || card.lateLabel).length;
}

export function weekDays(world: World, today: string, villaIds: readonly string[], flags: BoardFlags) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = addIsoDays(today, offset);
    const layout = dayLayout(world, date, villaIds, today, flags);
    return { date, count: workload(layout), isToday: offset === 0 };
  });
}

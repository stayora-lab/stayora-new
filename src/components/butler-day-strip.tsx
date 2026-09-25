import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { visibleGuestName } from "../lib/privacy.ts";
import {
  dateFromStrip,
  dayRelation,
  viewedDayLabel,
  type TimelineHit,
} from "../lib/butler-timeline.ts";
import type { RoleSession } from "../lib/role.ts";
import { getVilla } from "../lib/villas.ts";

const LANE_LABEL = {
  prepare: "Cần chuẩn bị",
  arriving: "Khách đến",
  departing: "Khách đi",
} as const;

export function ButlerDayStrip({
  today,
  viewed,
  onView,
}: {
  today: string;
  viewed: string;
  onView: (date: string) => void;
}) {
  const days = [
    { which: "yesterday" as const, mark: "< " },
    { which: "today" as const, mark: "" },
    { which: "tomorrow" as const, mark: "" },
  ];
  return (
    <div role="group" aria-label="Chọn ngày" data-day-strip className="mt-4 grid grid-cols-3 gap-2">
      {days.map((day) => {
        const date = dateFromStrip(today, day.which);
        const active = viewed === date;
        const label =
          day.which === "yesterday" ? "Hôm qua" : day.which === "today" ? "Hôm nay" : "Ngày mai";
        return (
          <button
            key={day.which}
            type="button"
            data-day={day.which}
            aria-pressed={active}
            onClick={() => onView(date)}
            className={`h-11 rounded-full text-sm font-medium ${
              active ? "bg-ink text-cream" : "bg-paper text-ink shadow-[var(--shadow-border)]"
            }`}
          >
            {day.which === "yesterday" ? "< " : ""}
            {label}
            {day.which === "tomorrow" ? " >" : ""}
          </button>
        );
      })}
    </div>
  );
}

export function ViewedDayLabel({ today, viewed }: { today: string; viewed: string }) {
  const other = dayRelation(today, viewed) !== "today";
  return (
    <p
      data-viewed-day={other ? "other" : "today"}
      className={
        other
          ? "mt-3 rounded-xl bg-lotus px-3 py-2 text-sm font-medium text-cream"
          : "mt-3 text-sm text-muted"
      }
    >
      {viewedDayLabel(today, viewed)}
    </p>
  );
}

export function EmptyDayNote({
  message,
  onOpen,
}: {
  message: string;
  onOpen?: () => void;
}) {
  if (!onOpen) {
    return (
      <p data-empty-day className="mt-6 rounded-2xl bg-paper px-4 py-5 text-sm text-ink shadow-[var(--shadow-border)]">
        {message}
      </p>
    );
  }
  return (
    <button
      type="button"
      data-empty-day
      onClick={onOpen}
      className="mt-6 w-full rounded-2xl bg-paper px-4 py-5 text-left text-sm text-ink shadow-[var(--shadow-border)]"
    >
      {message}
    </button>
  );
}

export function RollingDays({
  today,
  hits,
  role,
  onView,
}: {
  today: string;
  hits: readonly TimelineHit[];
  role: RoleSession;
  onView: (date: string) => void;
}) {
  if (hits.length === 0) return null;
  const dates = [...new Set(hits.map((hit) => hit.date))];
  return (
    <section data-rolling className="mx-auto max-w-lg px-4 pt-8 sm:px-6">
      <h2 className="font-serif text-2xl">4 ngày tới</h2>
      <div className="mt-3 space-y-4">
        {dates.map((date) => (
          <div key={date}>
            <button
              type="button"
              onClick={() => onView(date)}
              className="text-xs font-semibold tracking-wider text-muted uppercase"
            >
              {dayRelation(today, date) === "tomorrow"
                ? "Ngày mai"
                : format(parseISO(date), "EEEE d/M", { locale: vi })}
            </button>
            <ul className="mt-2 space-y-2">
              {hits
                .filter((hit) => hit.date === date)
                .map((hit) => {
                  const villa = getVilla(hit.stay.villaId);
                  return (
                    <li key={`${hit.lane}-${hit.stay.id}`}>
                      <button
                        type="button"
                        onClick={() => onView(date)}
                        className="w-full rounded-2xl bg-paper px-4 py-3 text-left shadow-[var(--shadow-border)]"
                      >
                        <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
                          {LANE_LABEL[hit.lane]}
                        </p>
                        <p className="mt-1 font-medium">{villa?.name ?? hit.stay.villaId}</p>
                        <p className="text-sm text-ink-soft">
                          {hit.stay.guests} khách · {visibleGuestName(hit.stay, role)}
                        </p>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

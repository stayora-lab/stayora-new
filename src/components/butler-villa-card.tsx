import { format, parseISO } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Flag,
  House,
  LogIn,
  LogOut,
  Phone,
  Sparkles,
  Triangle,
} from "lucide-react";
import type { CardAction, VillaCardModel, WindowId } from "../lib/butler-board-view.ts";
import { windowLabel } from "../lib/butler-board-view.ts";
import type { Stay } from "../lib/domain/types.ts";
import { visibleGuestName } from "../lib/privacy.ts";
import type { RoleSession } from "../lib/role.ts";
import { getVilla } from "../lib/villas.ts";

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const STRIPE = {
  "needs-prep": "border-sand",
  ready: "border-moss",
  quiet: "border-muted",
  blocked: "border-lotus",
} as const;

const MARK = {
  arrival: { icon: ArrowDownLeft, label: "Đến" },
  departure: { icon: ArrowUpRight, label: "Đi" },
  "in-house": { icon: House, label: "Đang ở" },
} as const;

function ActionIcon({ action }: { action: CardAction }) {
  if (action.kind === "release-hold") return <Triangle className="size-4 fill-current" aria-hidden />;
  if (action.id === "prepare") return <Sparkles className="size-4" aria-hidden />;
  if (action.id === "check-in") return <LogIn className="size-4" aria-hidden />;
  if (action.id === "check-out" || action.id === "observe-departure") {
    return <LogOut className="size-4" aria-hidden />;
  }
  return <ArrowDownLeft className="size-4" aria-hidden />;
}

export function WeekStrip({
  days,
  viewed,
  onView,
}: {
  days: readonly { date: string; count: number; isToday: boolean }[];
  viewed: string;
  onView: (date: string) => void;
}) {
  return (
    <div role="group" aria-label="7 ngày tới" data-week-strip className="mt-4 grid grid-cols-7 gap-1">
      {days.map((day) => {
        const selected = day.date === viewed;
        const date = parseISO(day.date);
        return (
          <button
            key={day.date}
            type="button"
            data-date={day.date}
            data-today={day.isToday ? "true" : "false"}
            aria-pressed={selected}
            onClick={() => onView(day.date)}
            className={`flex min-h-16 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 text-center ${
              selected
                ? "bg-ink text-cream"
                : day.isToday
                  ? "bg-paper text-ink ring-2 ring-lotus"
                  : "bg-paper text-ink shadow-[var(--shadow-border)]"
            }`}
          >
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              {day.isToday ? "Nay" : WEEKDAY[date.getDay()]}
            </span>
            <span className="text-sm font-medium leading-tight">{format(date, "d")}</span>
            <span data-workload={day.count} className="text-[11px] font-semibold">
              {day.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function VillaDayCard({
  card,
  stays,
  role,
  onOpen,
  onAction,
  onReport,
}: {
  card: VillaCardModel;
  stays: readonly Stay[];
  role: RoleSession;
  onOpen: (stayId: string) => void;
  onAction: (action: CardAction) => void;
  onReport: (stayId: string) => void;
}) {
  const villa = getVilla(card.villaId);
  const quiet = card.housekeeping === "quiet" && !card.action && !card.lateLabel && !card.attentionNote;
  const openStay = card.action && card.action.kind === "stay" ? card.action.stayId : card.events[0]?.stayId;
  const when = windowLabel(card.window);

  return (
    <article
      data-villa={card.villaId}
      data-order={card.order}
      data-housekeeping={card.housekeeping}
      data-window={card.window}
      data-pinned={card.attentionNote ? "true" : "false"}
      data-events={card.events.map((event) => event.mark).join(" ")}
      className={`rounded-2xl border-l-[6px] bg-paper shadow-[var(--shadow-border)] ${STRIPE[card.housekeeping]} ${
        quiet ? "px-3 py-2 opacity-70" : "p-4"
      }`}
    >
      <button
        type="button"
        onClick={() => openStay && onOpen(openStay)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{villa?.name ?? card.villaId}</p>
            <p className="text-sm text-muted">{card.villaId}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {card.attentionNote ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-lotus px-2 py-0.5 text-xs font-medium text-cream">
                <Triangle className="size-3 fill-current" data-shape="triangle" aria-hidden />
                Cần chú ý
              </span>
            ) : null}
            {card.needsPrep ? (
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-ink">Cần dọn</span>
            ) : null}
            {card.housekeeping === "ready" ? (
              <span className="rounded-full bg-moss px-2 py-0.5 text-xs font-medium text-cream">Sẵn sàng</span>
            ) : null}
            {card.housekeeping === "quiet" && !card.attentionNote ? (
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-muted">Đang ở</span>
            ) : null}
          </div>
        </div>
        {card.lateLabel ? <p className="mt-2 text-sm font-medium text-lotus">{card.lateLabel}</p> : null}
        {card.attentionNote ? <p className="mt-2 text-sm text-ink-soft">{card.attentionNote}</p> : null}
        {card.holdOverdue ? (
          <p className="mt-1 text-sm font-medium">Đã quá hạn xem lại. Vẫn đang giữ.</p>
        ) : null}
        <div className={quiet ? "mt-1" : "mt-3 space-y-2"}>
          {card.events.map((event) => {
            const stay = stays.find((item) => item.id === event.stayId);
            const Icon = MARK[event.mark].icon;
            const guest = stay ? visibleGuestName(stay, role) : "Khách";
            return (
              <div key={`${event.mark}-${event.stayId}`}>
                <p className="flex items-center gap-2 text-sm text-ink">
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span>
                    {MARK[event.mark].label} · {when}
                  </span>
                </p>
                <p className="pl-6 text-sm text-ink-soft">
                  {event.guests} khách
                  <span className="text-muted"> · Khách chính · </span>
                  {guest}
                </p>
              </div>
            );
          })}
        </div>
      </button>
      {card.action ? (
        <button
          type="button"
          data-next-action={card.action.kind === "stay" ? card.action.id : "release-hold"}
          data-action-tone={card.action.tone}
          className={`mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-cream ${
            card.action.tone === "moss" ? "bg-moss" : "bg-lotus"
          }`}
          onClick={() => onAction(card.action as CardAction)}
        >
          <ActionIcon action={card.action} />
          {card.action.label}
        </button>
      ) : null}
      {!quiet && card.events.length > 0 ? (
        <div className="mt-2 flex justify-end gap-1">
          <button
            type="button"
            disabled
            aria-label="Chưa có số điện thoại"
            className="inline-flex size-10 items-center justify-center rounded-full text-muted"
          >
            <Phone className="size-4" aria-hidden />
          </button>
          {openStay ? (
            <button
              type="button"
              aria-label="Báo sự cố"
              className="inline-flex size-10 items-center justify-center rounded-full text-ink"
              onClick={() => onReport(openStay)}
            >
              <Flag className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function ButlerDayList({
  pinned,
  late,
  windows,
  stays,
  role,
  onOpen,
  onAction,
  onReport,
}: {
  pinned: readonly VillaCardModel[];
  late: readonly VillaCardModel[];
  windows: readonly { id: WindowId; label: string; cards: readonly VillaCardModel[] }[];
  stays: readonly Stay[];
  role: RoleSession;
  onOpen: (stayId: string) => void;
  onAction: (action: CardAction) => void;
  onReport: (stayId: string) => void;
}) {
  const renderCard = (card: VillaCardModel) => (
    <VillaDayCard
      key={card.villaId}
      card={card}
      stays={stays}
      role={role}
      onOpen={onOpen}
      onAction={onAction}
      onReport={onReport}
    />
  );
  return (
    <div className="mx-auto max-w-lg px-4 sm:px-6">
      {pinned.length > 0 ? <div className="space-y-3 pt-4">{pinned.map(renderCard)}</div> : null}
      {late.length > 0 ? <div className="space-y-3 pt-4">{late.map(renderCard)}</div> : null}
      {windows.map((window) => (
        <section key={window.id} className="pt-4">
          <h2 className="sticky top-16 z-20 -mx-4 bg-cream/95 px-4 py-2 text-xs font-semibold tracking-wider text-muted uppercase backdrop-blur-md">
            {window.label}
          </h2>
          <div className="space-y-3">{window.cards.map(renderCard)}</div>
        </section>
      ))}
    </div>
  );
}

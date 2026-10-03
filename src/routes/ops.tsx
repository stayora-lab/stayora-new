import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { RoleGate } from "@/components/site-chrome";
import { OtherRoleHint } from "@/components/role-hint";
import { ButlerDayList, WeekStrip } from "@/components/butler-villa-card";
import { EmptyDayNote, ViewedDayLabel } from "@/components/butler-day-strip";
import { HostCalendar } from "@/components/host-calendar";
import { DateField } from "@/components/dates-guests";
import { Button } from "@/components/ui/button";
import {
  BUTLER_LINH,
  domainMessageVi,
  formatIctTime,
  viDateRange,
} from "@/lib/domain";
import type { Stay, World } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { getVilla, villas } from "@/lib/villas";
import { visibleGuestName } from "@/lib/privacy";
import type { NextCardAction } from "@/lib/butler-card";
import { cardOrder, dayLayout, drawerAction, FRESHNESS_DETAIL, weekDays, type CardAction } from "@/lib/butler-board-view";
import { readinessOf, activeEnhancedCleaningNote, type VillaReadiness } from "@/lib/domain";
import {
  emptyDayMessage,
  nextUpcoming,
  relativeDayPhrase,
  viewedDate,
} from "@/lib/butler-timeline";
import type { RoleSession } from "@/lib/role";

export const Route = createFileRoute("/ops")({
  component: OpsPage,
});

type CheckoutOutcome = "NORMAL" | "DAMAGE_COMPENSATION" | "ENHANCED_CLEANING";

type Sheet =
  | { kind: "incident"; stayId: string }
  | {
      kind: "checkout";
      stayId: string;
      outcome: CheckoutOutcome | null;
      phase: "form" | "done";
      completed?: boolean;
    }
  | null;

function ictDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function saleNameFor(world: World, stay: Stay): string | null {
  if (!stay.requestId) return null;
  const request = world.requests.find((item) => item.id === stay.requestId);
  if (!request?.saleId) return null;
  return world.sales.find((person) => person.id === request.saleId)?.name ?? null;
}

function openDamageIncident(world: World, stayId: string) {
  return world.incidents.find(
    (item) =>
      item.stayId === stayId && item.completionBlocker === true && item.status !== "RESOLVED",
  );
}

function enhancedNoteFor(world: World, villaId: string): string | null {
  return activeEnhancedCleaningNote(world, villaId);
}

function OpsPage() {
  const persona = useBookingStore((state) => state.persona);
  const butlerId = useBookingStore((state) => state.butlerId);
  const grants = useBookingStore((state) => state.grants);
  const world = useBookingStore((state) => state.world);
  const beginCleaning = useBookingStore((state) => state.beginCleaning);
  const completeCleaning = useBookingStore((state) => state.completeCleaning);
  const butlerObserveArrival = useBookingStore((state) => state.butlerObserveArrival);
  const butlerObserveDeparture = useBookingStore((state) => state.butlerObserveDeparture);
  const butlerCheckIn = useBookingStore((state) => state.butlerCheckIn);
  const butlerCheckoutWithAssessment = useBookingStore((state) => state.butlerCheckoutWithAssessment);
  const butlerIncident = useBookingStore((state) => state.butlerIncident);
  const placeProtectiveHold = useBookingStore((state) => state.placeProtectiveHold);
  const releaseProtectiveHold = useBookingStore((state) => state.releaseProtectiveHold);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [note, setNote] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBql = persona === "BQL";
  const activeButlerId = butlerId ?? BUTLER_LINH;
  const grantedVillas = grants
    .filter((grant) => grant.status === "active" && grant.role === "BUTLER" && grant.scopeRef)
    .map((grant) => grant.scopeRef as string)
    .filter((id) => villas.some((villa) => villa.id === id));
  const role: RoleSession = isBql
    ? { persona: "BQL" }
    : { persona: "BUTLER", butlerId: activeButlerId, villaIds: grantedVillas };
  const butler = world.butlers.find((person) => person.id === activeButlerId);
  const today = ictDay(world.now);
  const viewed = viewedDate(today, pickedDate);
  const scope = isBql
    ? [...new Set(world.stays.map((stay) => stay.villaId))]
    : [...new Set([...(butler?.villaIds ?? []), ...grantedVillas])];
  const flags = { canAct: !isBql, canHold: isBql };
  const layout = dayLayout(world, viewed, scope, today, flags);
  const strip = weekDays(world, today, scope, flags);
  const empty = cardOrder(layout).length === 0;
  const next = empty ? nextUpcoming(world, scope, viewed) : null;
  const nextVilla = next ? (getVilla(next.stay.villaId)?.name ?? next.stay.villaId) : "";
  const emptyMessage = empty
    ? emptyDayMessage(
        viewed === today,
        next
          ? {
              villaName: nextVilla,
              arriving: next.lane !== "departing",
              when: relativeDayPhrase(today, next.date),
            }
          : null,
      )
    : "";
  const openStay = world.stays.find((stay) => stay.id === openId) ?? null;
  const sheetStay = sheet ? world.stays.find((stay) => stay.id === sheet.stayId) : undefined;

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(domainMessageVi(err));
    }
  }

  function submitIncident() {
    if (!sheet || sheet.kind !== "incident" || !sheetStay) return;
    if (!note.trim()) {
      setError("Cần mô tả sự cố");
      return;
    }
    run(() => butlerIncident(sheetStay.id, note, hasPhoto));
    setSheet(null);
    setNote("");
    setHasPhoto(false);
  }

  function openCheckout(stayId: string) {
    setNote("");
    setHasPhoto(false);
    setError(null);
    setSheet({ kind: "checkout", stayId, outcome: null, phase: "form" });
  }

  async function confirmCheckout() {
    if (!sheet || sheet.kind !== "checkout" || !sheet.outcome) return;
    if (sheet.outcome !== "NORMAL" && !note.trim()) {
      setError(sheet.outcome === "DAMAGE_COMPENSATION" ? "Cần mô tả hư hỏng" : "Cần ghi việc dọn");
      return;
    }
    const stayId = sheet.stayId;
    const outcome = sheet.outcome;
    setError(null);
    try {
      await butlerCheckoutWithAssessment(stayId, outcome, note.trim() || undefined, hasPhoto);
      const stay = useBookingStore.getState().world.stays.find((item) => item.id === stayId);
      setSheet({
        kind: "checkout",
        stayId,
        outcome,
        phase: "done",
        completed: stay?.status === "COMPLETED",
      });
    } catch (err) {
      setError(domainMessageVi(err));
    }
  }

  function runCard(action: CardAction) {
    if (action.kind === "release-hold") return run(() => releaseProtectiveHold(action.holdId));
    if (action.kind === "begin-cleaning") return run(() => beginCleaning(action.villaId));
    if (action.kind === "complete-cleaning") return run(() => completeCleaning(action.villaId));
    return runStay(action.stayId, action.id);
  }

  function runStay(stayId: string, actionId: NextCardAction["id"]) {
    if (actionId === "observe-arrival") return run(() => butlerObserveArrival(stayId));
    if (actionId === "check-in") return run(() => butlerCheckIn(stayId));
    if (actionId === "observe-departure") return run(() => butlerObserveDeparture(stayId));
    return openCheckout(stayId);
  }

  return (
    <RoleGate allow={["BUTLER", "BQL"]}>
      <main lang="vi" className="pb-24">
        <div className="mx-auto max-w-lg px-4 pt-6 sm:px-6">
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
            {isBql ? "BQL Oceanami" : (butler?.name ?? "Quản gia")}
          </p>
          <h1 className="mt-1 font-serif text-title">Việc hôm nay</h1>
          <WeekStrip
            days={strip}
            viewed={viewed}
            onView={(date) => setPickedDate(date === today ? null : date)}
          />
          <ViewedDayLabel today={today} viewed={viewed} />
          <p className="mt-2 text-xs text-muted">
            Giờ đến và giờ đi chưa được ghi. Sáng, Chiều, Tối là thứ tự villa được giao, không phải giờ khách hẹn.
          </p>
          <div className="mt-2">
            <DateField
              date={viewed}
              onChange={(date) => setPickedDate(date === today ? null : date)}
              label="Nhảy tới ngày"
              calendarTitle="Chọn ngày"
              locale={vi}
              formatLabel={(value) => format(parseISO(value), "d/M/yyyy", { locale: vi })}
              className="h-10 bg-transparent px-1 shadow-none"
            />
          </div>
          {error ? <p className="mt-3 text-sm text-lotus-deep">{error}</p> : null}
          {isBql ? (
            <p className="mt-3 text-sm text-muted">
              Xem ngày đến, ngày đi, và việc cần chú ý. Có thể giữ bảo vệ khi villa cần được xem. Không nhận phòng, không trả phòng.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">Ca hôm nay của bạn.</p>
          )}
          {persona === "BUTLER" || persona === "BQL" ? <OtherRoleHint current={persona} /> : null}
        </div>

        {!empty ? (
          <ButlerDayList
            pinned={layout.pinned}
            late={layout.late}
            windows={layout.windows}
            stays={world.stays}
            role={role}
            onOpen={setOpenId}
            onAction={runCard}
            onReport={(stayId) => {
              setNote("");
              setHasPhoto(false);
              setSheet({ kind: "incident", stayId });
            }}
          />
        ) : (
          <div className="mx-auto max-w-lg px-4 sm:px-6">
            <EmptyDayNote
              message={emptyMessage}
              onOpen={next ? () => setPickedDate(next.date === today ? null : next.date) : undefined}
            />
          </div>
        )}

        {isBql ? (
          <section className="pt-8">
            <h2 className="mx-auto max-w-lg px-4 font-serif text-2xl sm:px-6">Lịch</h2>
            <div className="mt-3">
              <HostCalendar
                world={world}
                composer={false}
                onExternal={() => undefined}
                onBlock={() => undefined}
                onRelease={() => undefined}
                onPlaceHold={(input) => run(() => placeProtectiveHold(input))}
                onReleaseHold={(id) => run(() => releaseProtectiveHold(id))}
              />
            </div>
          </section>
        ) : null}

        <Drawer.Root open={Boolean(openStay)} onOpenChange={(open) => !open && setOpenId(null)}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-10">
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
              {openStay ? (
                <StayWork
                  stay={openStay}
                  role={role}
                  saleName={saleNameFor(world, openStay)}
                  waiting={Boolean(openDamageIncident(world, openStay.id))}
                  enhancedNote={enhancedNoteFor(world, openStay.villaId)}
                  canAct={!isBql && scope.includes(openStay.villaId)}
                  canHold={isBql}
                  viewed={viewed}
                  onPlaceHold={() =>
                    run(() =>
                      placeProtectiveHold({
                        villaId: openStay.villaId,
                        start: openStay.checkIn,
                        end: openStay.checkOut,
                        note: "Cần xem villa",
                      }),
                    )
                  }
                  readiness={readinessOf(world, openStay.villaId)}
                  onBeginCleaning={() => run(() => beginCleaning(openStay.villaId))}
                  onCompleteCleaning={() => run(() => completeCleaning(openStay.villaId))}
                  onArrival={() => run(() => butlerObserveArrival(openStay.id))}
                  onCheckIn={() => run(() => butlerCheckIn(openStay.id))}
                  onDeparture={() => run(() => butlerObserveDeparture(openStay.id))}
                  onCheckOut={() => openCheckout(openStay.id)}
                  onIncident={() => {
                    setNote("");
                    setHasPhoto(false);
                    setSheet({ kind: "incident", stayId: openStay.id });
                  }}
                />
              ) : null}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        <Drawer.Root
          open={Boolean(sheet)}
          onOpenChange={(open) => {
            if (!open) {
              setSheet(null);
              setNote("");
              setHasPhoto(false);
            }
          }}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[60] bg-ink/40" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-[60] max-h-[92vh] rounded-t-2xl bg-paper outline-none">
              <div className="max-h-[92vh] overflow-y-auto p-5 pb-10">
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
              {sheet?.kind === "incident" && sheetStay ? (
                <>
                  <p className="font-serif text-2xl">Báo sự cố</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Chỉ ghi sự cố. Không khoá lịch, không đổi đặt phòng.
                  </p>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Mô tả ngắn"
                    rows={4}
                    className="mt-4 w-full rounded-xl bg-cream p-3 text-ink outline-none ring-lotus/40 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setHasPhoto((value) => !value)}
                    className="mt-3 flex h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-cream text-sm text-ink-soft"
                  >
                    {hasPhoto ? (
                      <>
                        <X className="size-4" /> Đã gắn 1 ảnh
                      </>
                    ) : (
                      <>
                        <ImagePlus className="size-4" /> Thêm ảnh
                      </>
                    )}
                  </button>
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>
                      Huỷ
                    </Button>
                    <Button className="flex-1" onClick={submitIncident} disabled={!note.trim()}>
                      Gửi sự cố
                    </Button>
                  </div>
                </>
              ) : null}
              {sheet?.kind === "checkout" && sheetStay ? (
                <div data-checkout-assessment>
                  <p className="font-serif text-2xl">Trả phòng — {getVilla(sheetStay.villaId)?.name ?? sheetStay.villaId}</p>
                  {sheet.phase === "done" ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-ink">Đã ghi nhận trả phòng.</p>
                      {sheet.completed ? (
                        <p className="rounded-xl bg-cream px-3 py-3 text-sm text-ink" data-completion-result>
                          Kỳ ở đã hoàn tất. Việc này do hệ thống ghi, không phải nút của quản gia.
                        </p>
                      ) : (
                        <p className="rounded-xl bg-cream px-3 py-3 text-sm font-medium text-ink" data-completion-wait>
                          Đã trả phòng · đang chờ xử lý
                        </p>
                      )}
                      {sheet.outcome === "ENHANCED_CLEANING" ? (
                        <p className="text-sm text-ink-soft">
                          Cần vệ sinh tăng cường vẫn là việc dọn. Villa đang cần dọn.
                        </p>
                      ) : null}
                      <Button className="h-12 w-full" onClick={() => setSheet(null)}>
                        Xong
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-ink-soft">Tình trạng khi khách rời villa?</p>
                      <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Tình trạng khi khách rời villa">
                        {(
                          [
                            ["NORMAL", "Bình thường"],
                            ["DAMAGE_COMPENSATION", "Có hư hỏng / cần xử lý bồi thường"],
                            ["ENHANCED_CLEANING", "Cần vệ sinh tăng cường"],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm ${
                              sheet.outcome === value ? "bg-ink text-cream" : "bg-cream text-ink"
                            }`}
                          >
                            <input
                              type="radio"
                              name="checkout-outcome"
                              className="size-4"
                              checked={sheet.outcome === value}
                              onChange={() =>
                                setSheet({ ...sheet, outcome: value })
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      {sheet.outcome === "DAMAGE_COMPENSATION" || sheet.outcome === "ENHANCED_CLEANING" ? (
                        <>
                          <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder={
                              sheet.outcome === "DAMAGE_COMPENSATION" ? "Mô tả hư hỏng" : "Việc dọn cần làm"
                            }
                            rows={3}
                            className="mt-4 w-full rounded-xl bg-cream p-3 text-ink outline-none ring-lotus/40 focus:ring-2"
                          />
                          {sheet.outcome === "DAMAGE_COMPENSATION" ? (
                            <button
                              type="button"
                              onClick={() => setHasPhoto((value) => !value)}
                              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-cream text-sm text-ink-soft"
                            >
                              {hasPhoto ? "Đã gắn 1 ảnh" : "Thêm ảnh"}
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      <p className="mt-4 text-sm text-ink">Ghi nhận trả phòng</p>
                      <p className="mt-1 text-sm text-muted">
                        {sheet.outcome === "DAMAGE_COMPENSATION"
                          ? "Trả phòng sẽ được ghi. Kỳ ở chưa hoàn tất. Không tính bồi thường."
                          : "Sau khi ghi, hệ thống tự xét hoàn tất. Không có nút hoàn tất riêng."}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" className="h-12 flex-1" onClick={() => setSheet(null)}>
                          Huỷ
                        </Button>
                        <Button
                          className="h-12 flex-1"
                          disabled={!sheet.outcome || (sheet.outcome !== "NORMAL" && !note.trim())}
                          onClick={() => void confirmCheckout()}
                        >
                          Ghi nhận trả phòng
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </main>
    </RoleGate>
  );
}

function factLine(label: string, at: string | undefined) {
  if (!at) return null;
  return (
    <p key={label} className="text-sm text-ink">
      {label}
      <span className="text-muted"> · {formatIctTime(at)}</span>
    </p>
  );
}

function StayWork({
  stay,
  readiness,
  role,
  saleName,
  waiting,
  enhancedNote,
  canAct,
  canHold,
  viewed,
  onPlaceHold,
  onBeginCleaning,
  onCompleteCleaning,
  onArrival,
  onCheckIn,
  onDeparture,
  onCheckOut,
  onIncident,
}: {
  stay: Stay;
  readiness: VillaReadiness;
  role: RoleSession;
  saleName: string | null;
  waiting: boolean;
  enhancedNote: string | null;
  canAct: boolean;
  canHold: boolean;
  viewed: string;
  onPlaceHold: () => void;
  onBeginCleaning: () => void;
  onCompleteCleaning: () => void;
  onArrival: () => void;
  onCheckIn: () => void;
  onDeparture: () => void;
  onCheckOut: () => void;
  onIncident: () => void;
}) {
  const villa = getVilla(stay.villaId);
  const action = canAct ? drawerAction(stay, readiness.state, viewed) : null;
  const freshness = readiness.cause === "FRESHNESS_DECAY" && readiness.state === "DIRTY";
  const readinessLine = freshness
    ? "Chuẩn bị lại"
    : readiness.state === "CLEANING"
      ? "Đang dọn"
      : readiness.state === "READY"
        ? "Sẵn sàng"
        : "Cần dọn";

  function runAction() {
    if (!action) return;
    if (action.kind === "begin-cleaning") return onBeginCleaning();
    if (action.kind === "complete-cleaning") return onCompleteCleaning();
    if (action.kind !== "stay") return;
    if (action.id === "observe-arrival") return onArrival();
    if (action.id === "check-in") return onCheckIn();
    if (action.id === "observe-departure") return onDeparture();
    return onCheckOut();
  }

  return (
    <div>
      <p className="font-serif text-2xl">{villa?.name ?? stay.villaId}</p>
      <p className="mt-1 text-sm text-ink-soft">{visibleGuestName(stay, role)}</p>
      {saleName ? <p className="mt-1 text-sm text-ink">Qua Sale: {saleName}</p> : null}
      <p className="mt-2 text-sm text-muted">
        {stay.guests} khách · {viDateRange(stay.checkIn, stay.checkOut)}
      </p>
      <div className="mt-4 space-y-1">
        <p className="text-sm text-ink">Villa {readinessLine}</p>
        {freshness ? (
          <p className="text-sm text-ink">{FRESHNESS_DETAIL}</p>
        ) : null}
        {factLine("Đã thấy khách đến", stay.arrivalObservedAt)}
        {stay.arrivalObservedAt && stay.status === "SCHEDULED" ? (
          <p className="text-sm text-ink-soft">Chưa nhận phòng.</p>
        ) : null}
        {factLine("Đã nhận phòng", stay.checkedInAt)}
        {factLine("Đã thấy khách rời villa", stay.departureObservedAt)}
        {stay.departureObservedAt && stay.status === "CHECKED_IN" ? (
          <p className="text-sm text-ink-soft">Chưa trả phòng.</p>
        ) : null}
        {factLine("Đã trả phòng", stay.checkedOutAt)}
        {stay.status === "COMPLETED" ? (
          <p className="text-sm text-ink">Kỳ ở đã hoàn tất.</p>
        ) : null}
        {waiting ? (
          <p className="text-sm font-medium text-ink" data-completion-wait>
            Đã trả phòng · đang chờ xử lý
          </p>
        ) : null}
        {enhancedNote && (readiness.state === "DIRTY" || readiness.state === "CLEANING") ? (
          <p className="text-sm text-ink">Cần vệ sinh tăng cường. {enhancedNote}</p>
        ) : null}
      </div>
      {action ? (
        <button
          type="button"
          data-next-action={action.kind === "stay" ? action.id : action.kind}
          className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-cream ${
            action.tone === "moss" ? "bg-moss" : "bg-lotus"
          }`}
          onClick={runAction}
        >
          {action.label}
        </button>
      ) : null}
      {canAct ? (
        <Button variant="ghost" className="mt-2 h-12 w-full" onClick={onIncident}>
          Báo sự cố
        </Button>
      ) : null}
      {canHold ? (
        <div className="mt-5 grid grid-cols-1 gap-2">
          <Button variant="ghost" className="h-12" onClick={onIncident}>
            Báo sự cố
          </Button>
          <Button className="h-12" onClick={onPlaceHold}>
            Giữ bảo vệ
          </Button>
        </div>
      ) : null}
    </div>
  );
}

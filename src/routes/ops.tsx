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
import { cardOrder, dayLayout, weekDays, type CardAction } from "@/lib/butler-board-view";
import { readinessOf, type VillaReadinessState } from "@/lib/domain";
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

type Sheet =
  | { kind: "noshow"; stayId: string }
  | { kind: "incident"; stayId: string; checkoutDamage?: boolean }
  | { kind: "assessment"; stayId: string }
  | { kind: "enhanced"; stayId: string }
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

function assessmentFor(world: World, stayId: string) {
  return (world.checkoutAssessments ?? []).find((item) => item.stayId === stayId);
}

function openDamageIncident(world: World, stayId: string) {
  return world.incidents.find(
    (item) =>
      item.stayId === stayId && item.completionBlocker === true && item.status !== "RESOLVED",
  );
}

function enhancedNoteFor(world: World, stayId: string): string | null {
  const note = (world.readinessNotes ?? []).find(
    (item) => item.stayId === stayId && item.kind === "ENHANCED_CLEANING",
  );
  return note?.note ?? null;
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
  const butlerCheckOut = useBookingStore((state) => state.butlerCheckOut);
  const recordCheckoutAssessment = useBookingStore((state) => state.recordCheckoutAssessment);
  const completeStay = useBookingStore((state) => state.completeStay);
  const resolveCheckoutDamage = useBookingStore((state) => state.resolveCheckoutDamage);
  const butlerNoShow = useBookingStore((state) => state.butlerNoShow);
  const butlerIncident = useBookingStore((state) => state.butlerIncident);
  const placeProtectiveHold = useBookingStore((state) => state.placeProtectiveHold);
  const releaseProtectiveHold = useBookingStore((state) => state.releaseProtectiveHold);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [reason, setReason] = useState("");
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

  function submitNoShow() {
    if (!sheet || sheet.kind !== "noshow" || !sheetStay) return;
    if (!reason.trim()) setReason("NO_SHOW");
    run(() => butlerNoShow(sheetStay.id, reason.trim() || "NO_SHOW"));
    setSheet(null);
    setReason("");
  }

  function submitIncident() {
    if (!sheet || sheet.kind !== "incident" || !sheetStay) return;
    if (!note.trim()) {
      setError("Cần mô tả sự cố");
      return;
    }
    if (sheet.checkoutDamage) {
      run(() =>
        recordCheckoutAssessment(sheetStay.id, "DAMAGE_COMPENSATION", note, hasPhoto),
      );
    } else {
      run(() => butlerIncident(sheetStay.id, note, hasPhoto));
    }
    setSheet(null);
    setNote("");
    setHasPhoto(false);
  }

  function beginCheckout(stayId: string) {
    run(async () => {
      await butlerCheckOut(stayId);
      setNote("");
      setSheet({ kind: "assessment", stayId });
    });
  }

  function finishNormal(stayId: string) {
    run(async () => {
      await recordCheckoutAssessment(stayId, "NORMAL");
      await completeStay(stayId);
      setSheet(null);
    });
  }

  function finishEnhanced() {
    if (!sheet || sheet.kind !== "enhanced" || !sheetStay) return;
    if (!note.trim()) {
      setError("Cần ghi việc dọn");
      return;
    }
    const stayId = sheetStay.id;
    const text = note;
    run(async () => {
      await recordCheckoutAssessment(stayId, "ENHANCED_CLEANING", text);
      await completeStay(stayId);
    });
    setSheet(null);
    setNote("");
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
    return beginCheckout(stayId);
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
            <p className="mt-3 text-sm text-muted">Chỉ villa được giao cho bạn.</p>
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
                  waitingOnDamage={Boolean(openDamageIncident(world, openStay.id))}
                  needsAssessment={
                    openStay.status === "CHECKED_OUT" && !assessmentFor(world, openStay.id)
                  }
                  canComplete={
                    openStay.status === "CHECKED_OUT" &&
                    Boolean(assessmentFor(world, openStay.id)) &&
                    !openDamageIncident(world, openStay.id)
                  }
                  enhancedNote={enhancedNoteFor(world, openStay.id)}
                  canResolve={Boolean(
                    openDamageIncident(world, openStay.id) &&
                      role.damageResolutionVillaIds?.includes(openStay.villaId),
                  )}
                  canAct={!isBql && scope.includes(openStay.villaId)}
                  canHold={isBql}
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
                  readiness={readinessOf(world, openStay.villaId).state}
                  onBeginCleaning={() => run(() => beginCleaning(openStay.villaId))}
                  onCompleteCleaning={() => run(() => completeCleaning(openStay.villaId))}
                  onArrival={() => run(() => butlerObserveArrival(openStay.id))}
                  onCheckIn={() => run(() => butlerCheckIn(openStay.id))}
                  onDeparture={() => run(() => butlerObserveDeparture(openStay.id))}
                  onCheckOut={() => beginCheckout(openStay.id)}
                  onAssess={() => setSheet({ kind: "assessment", stayId: openStay.id })}
                  onComplete={() => run(() => completeStay(openStay.id))}
                  onResolve={() => {
                    const incident = openDamageIncident(world, openStay.id);
                    if (incident) run(() => resolveCheckoutDamage(incident.id));
                  }}
                  onNoShow={() => {
                    setReason("");
                    setSheet({ kind: "noshow", stayId: openStay.id });
                  }}
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
              setReason("");
              setNote("");
              setHasPhoto(false);
            }
          }}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[60] bg-ink/40" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl bg-paper p-5 pb-10">
              <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
              {sheet?.kind === "noshow" && sheetStay ? (
                <>
                  <p className="font-serif text-2xl">Khách không đến</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    {getVilla(sheetStay.villaId)?.name} · {visibleGuestName(sheetStay, role)}. Chọn lý do. Không tự ghi khi quá ngày.
                  </p>
                  <label className="mt-4 block text-sm">
                    Lý do
                    <select
                      value={reason || "NO_SHOW"}
                      onChange={(event) => setReason(event.target.value)}
                      className="mt-1 h-12 w-full rounded-xl bg-cream px-3"
                    >
                      <option value="NO_SHOW">Khách không đến</option>
                      <option value="BOOKING_CANCELLED">Đặt chỗ đã huỷ</option>
                      <option value="OTHER_AUTHORIZED_REASON">Lý do khác đã được phép</option>
                    </select>
                  </label>
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>
                      Huỷ
                    </Button>
                    <Button className="flex-1" onClick={submitNoShow}>
                      Ghi nhận
                    </Button>
                  </div>
                </>
              ) : null}
              {sheet?.kind === "incident" && sheetStay ? (
                <>
                  <p className="font-serif text-2xl">
                    {sheet.checkoutDamage ? "Hư hại cần xử lý" : "Báo sự cố"}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    {sheet.checkoutDamage
                      ? "Ghi sự cố cho lần trả phòng này. Chưa có giao dịch tiền. Lưu trú chưa hoàn tất cho đến khi sự cố được gỡ."
                      : "Chỉ ghi sự cố. Không khoá lịch, không đổi đặt phòng."}
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
              {sheet?.kind === "assessment" ? (
                <div data-checkout-assessment>
                  <p className="font-serif text-2xl">Đánh giá khi trả phòng</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Chọn một kết quả. Bình thường và dọn kỹ không cần chủ nhà duyệt.
                  </p>
                  <div className="mt-5 grid gap-2">
                    <Button className="h-12" onClick={() => finishNormal(sheet.stayId)}>
                      Bình thường
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12"
                      onClick={() => {
                        setNote("");
                        setHasPhoto(false);
                        setSheet({ kind: "incident", stayId: sheet.stayId, checkoutDamage: true });
                      }}
                    >
                      Hư hại cần xử lý
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12"
                      onClick={() => {
                        setNote("");
                        setSheet({ kind: "enhanced", stayId: sheet.stayId });
                      }}
                    >
                      Cần dọn kỹ hơn
                    </Button>
                  </div>
                </div>
              ) : null}
              {sheet?.kind === "enhanced" ? (
                <>
                  <p className="font-serif text-2xl">Cần dọn kỹ hơn</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Ghi việc dọn. Không thêm trạng thái villa, không chặn hoàn tất.
                  </p>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Việc dọn cần làm"
                    rows={3}
                    className="mt-4 w-full rounded-xl bg-cream p-3 text-ink outline-none ring-lotus/40 focus:ring-2"
                  />
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>
                      Huỷ
                    </Button>
                    <Button className="flex-1" onClick={finishEnhanced} disabled={!note.trim()}>
                      Ghi và hoàn tất
                    </Button>
                  </div>
                </>
              ) : null}
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
  waitingOnDamage,
  needsAssessment,
  canComplete,
  enhancedNote,
  canResolve,
  canAct,
  canHold,
  onPlaceHold,
  onBeginCleaning,
  onCompleteCleaning,
  onArrival,
  onCheckIn,
  onDeparture,
  onCheckOut,
  onAssess,
  onComplete,
  onResolve,
  onNoShow,
  onIncident,
}: {
  stay: Stay;
  readiness: VillaReadinessState;
  role: RoleSession;
  saleName: string | null;
  waitingOnDamage: boolean;
  needsAssessment: boolean;
  canComplete: boolean;
  enhancedNote: string | null;
  canResolve: boolean;
  canAct: boolean;
  canHold: boolean;
  onPlaceHold: () => void;
  onBeginCleaning: () => void;
  onCompleteCleaning: () => void;
  onArrival: () => void;
  onCheckIn: () => void;
  onDeparture: () => void;
  onCheckOut: () => void;
  onAssess: () => void;
  onComplete: () => void;
  onResolve: () => void;
  onNoShow: () => void;
  onIncident: () => void;
}) {
  const villa = getVilla(stay.villaId);
  const scheduled = stay.status === "SCHEDULED";
  const inHouse = stay.status === "CHECKED_IN";
  const checkedOut = stay.status === "CHECKED_OUT" || stay.status === "COMPLETED";
  const canNoteArrival = scheduled || inHouse;
  const canNoteDeparture = scheduled || inHouse || checkedOut;

  return (
    <div>
      <p className="font-serif text-2xl">{villa?.name ?? stay.villaId}</p>
      <p className="mt-1 text-sm text-ink-soft">{visibleGuestName(stay, role)}</p>
      {saleName ? <p className="mt-1 text-sm text-ink">Qua Sale: {saleName}</p> : null}
      <p className="mt-2 text-sm text-muted">
        {stay.guests} khách · {viDateRange(stay.checkIn, stay.checkOut)}
      </p>
      <div className="mt-4 space-y-1">
        <p className="text-sm text-ink">
          Villa{" "}
          {readiness === "CLEANING" ? "đang dọn" : readiness === "READY" ? "sẵn sàng" : "cần dọn"}
        </p>
        {factLine("Đã thấy khách tới", stay.arrivalObservedAt)}
        {factLine("Đã nhận phòng", stay.checkedInAt)}
        {factLine("Đã thấy khách rời", stay.departureObservedAt)}
        {factLine("Đã trả phòng", stay.checkedOutAt)}
        {factLine("Ca lưu trú đã hoàn tất", stay.completedAt)}
        {stay.status === "CHECKED_OUT" && !stay.completedAt ? (
          <p className="text-sm text-ink">Ca chưa hoàn tất.</p>
        ) : null}
        {waitingOnDamage ? (
          <p className="text-sm font-medium text-lotus" data-completion-wait>
            Đang chờ xử lý sự cố hư hại. Lưu trú chưa hoàn tất.
          </p>
        ) : null}
        {enhancedNote ? <p className="text-sm text-ink-soft">Dọn kỹ: {enhancedNote}</p> : null}
      </div>
      {canAct ? (
        <div className="mt-5 grid grid-cols-1 gap-2">
          {readiness === "DIRTY" ? (
            <Button className="h-12" onClick={onBeginCleaning}>
              Bắt đầu dọn
            </Button>
          ) : null}
          {readiness === "CLEANING" ? (
            <Button className="h-12" onClick={onCompleteCleaning}>
              Dọn xong
            </Button>
          ) : null}
          {canNoteArrival && !stay.arrivalObservedAt ? (
            <Button variant="outline" className="h-12" onClick={onArrival}>
              Khách đã tới
            </Button>
          ) : null}
          {scheduled ? (
            <Button className="h-12" onClick={onCheckIn}>
              Nhận phòng
            </Button>
          ) : null}
          {canNoteDeparture && !stay.departureObservedAt ? (
            <div>
              <Button variant="outline" className="h-12 w-full" onClick={onDeparture}>
                Khách đã rời
              </Button>
              <p className="mt-2 text-sm text-muted">
                Xác nhận đã thấy khách rời villa. Sau đó kiểm tra phòng rồi bấm Trả phòng.
              </p>
            </div>
          ) : null}
          {inHouse ? (
            <Button variant="ink" className="h-12" onClick={onCheckOut}>
              Trả phòng
            </Button>
          ) : null}
          {needsAssessment ? (
            <Button className="h-12" onClick={onAssess}>
              Ghi đánh giá trả phòng
            </Button>
          ) : null}
          {canComplete ? (
            <Button variant="ink" className="h-12" onClick={onComplete}>
              Lưu trú hoàn tất
            </Button>
          ) : null}
          {canResolve ? (
            <Button variant="outline" className="h-12" onClick={onResolve}>
              Gỡ chặn hư hại
            </Button>
          ) : null}
          {scheduled ? (
            <Button variant="outline" className="h-12" onClick={onNoShow}>
              Khách không đến
            </Button>
          ) : null}
          <Button variant="ghost" className="h-12" onClick={onIncident}>
            Báo sự cố
          </Button>
        </div>
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

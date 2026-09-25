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
import type { Stay } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { getVilla, villas } from "@/lib/villas";
import { visibleGuestName } from "@/lib/privacy";
import type { NextCardAction } from "@/lib/butler-card";
import { cardOrder, dayLayout, weekDays, type CardAction } from "@/lib/butler-board-view";
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

type Sheet = { kind: "noshow"; stayId: string } | { kind: "incident"; stayId: string } | null;

function ictDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function OpsPage() {
  const persona = useBookingStore((state) => state.persona);
  const butlerId = useBookingStore((state) => state.butlerId);
  const grants = useBookingStore((state) => state.grants);
  const world = useBookingStore((state) => state.world);
  const butlerPrepare = useBookingStore((state) => state.butlerPrepare);
  const butlerObserveArrival = useBookingStore((state) => state.butlerObserveArrival);
  const butlerObserveDeparture = useBookingStore((state) => state.butlerObserveDeparture);
  const butlerCheckIn = useBookingStore((state) => state.butlerCheckIn);
  const butlerCheckOut = useBookingStore((state) => state.butlerCheckOut);
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
    run(() => butlerIncident(sheetStay.id, note, hasPhoto));
    setSheet(null);
    setNote("");
    setHasPhoto(false);
  }

  function runCard(action: CardAction) {
    if (action.kind === "release-hold") return run(() => releaseProtectiveHold(action.holdId));
    return runStay(action.stayId, action.id);
  }

  function runStay(stayId: string, actionId: NextCardAction["id"]) {
    if (actionId === "prepare") return run(() => butlerPrepare(stayId));
    if (actionId === "observe-arrival") return run(() => butlerObserveArrival(stayId));
    if (actionId === "check-in") return run(() => butlerCheckIn(stayId));
    if (actionId === "observe-departure") return run(() => butlerObserveDeparture(stayId));
    return run(() => butlerCheckOut(stayId));
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
                  onPrepare={() => run(() => butlerPrepare(openStay.id))}
                  onArrival={() => run(() => butlerObserveArrival(openStay.id))}
                  onCheckIn={() => run(() => butlerCheckIn(openStay.id))}
                  onDeparture={() => run(() => butlerObserveDeparture(openStay.id))}
                  onCheckOut={() => run(() => butlerCheckOut(openStay.id))}
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
  role,
  canAct,
  canHold,
  onPlaceHold,
  onPrepare,
  onArrival,
  onCheckIn,
  onDeparture,
  onCheckOut,
  onNoShow,
  onIncident,
}: {
  stay: Stay;
  role: RoleSession;
  canAct: boolean;
  canHold: boolean;
  onPlaceHold: () => void;
  onPrepare: () => void;
  onArrival: () => void;
  onCheckIn: () => void;
  onDeparture: () => void;
  onCheckOut: () => void;
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
      <p className="mt-2 text-sm text-muted">
        {stay.guests} khách · {viDateRange(stay.checkIn, stay.checkOut)}
      </p>
      <div className="mt-4 space-y-1">
        {factLine("Villa đã chuẩn bị", stay.preparedAt)}
        {factLine("Đã thấy khách tới", stay.arrivalObservedAt)}
        {factLine("Đã nhận phòng", stay.checkedInAt)}
        {factLine("Đã thấy khách rời", stay.departureObservedAt)}
        {factLine("Đã trả phòng", stay.checkedOutAt)}
        {factLine("Ca lưu trú đã hoàn tất", stay.completedAt)}
        {stay.status === "CHECKED_OUT" && !stay.completedAt ? (
          <p className="text-sm text-ink">Ca chưa hoàn tất.</p>
        ) : null}
      </div>
      {canAct ? (
        <div className="mt-5 grid grid-cols-1 gap-2">
          {scheduled && !stay.preparedAt ? (
            <Button className="h-12" onClick={onPrepare}>
              Đã chuẩn bị xong
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
            <Button variant="outline" className="h-12" onClick={onDeparture}>
              Khách đã rời
            </Button>
          ) : null}
          {inHouse ? (
            <Button variant="ink" className="h-12" onClick={onCheckOut}>
              Trả phòng
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

import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { RoleGate } from "@/components/site-chrome";
import { HostCalendar } from "@/components/host-calendar";
import { DateField } from "@/components/dates-guests";
import { Button } from "@/components/ui/button";
import {
  BUTLER_LINH,
  butlerFieldBoard,
  domainMessageVi,
  formatIctTime,
  viDateRange,
} from "@/lib/domain";
import type { Stay } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { getVilla, villas } from "@/lib/villas";
import { visibleGuestName } from "@/lib/privacy";
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
  const role: RoleSession = isBql
    ? { persona: "BQL" }
    : { persona: "BUTLER", butlerId: activeButlerId };
  const butler = world.butlers.find((person) => person.id === activeButlerId);
  const opsDate = pickedDate ?? ictDay(world.now);
  const scope = isBql
    ? [...new Set(world.stays.map((stay) => stay.villaId))]
    : (butler?.villaIds ?? []);
  const board = butlerFieldBoard(world, opsDate, scope);
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
    if (!reason.trim()) {
      setError("Cần nêu lý do");
      return;
    }
    run(() => butlerNoShow(sheetStay.id, reason));
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

  return (
    <RoleGate allow={["BUTLER", "BQL"]}>
      <main lang="vi" className="pb-24">
        <div className="mx-auto max-w-lg px-4 pt-6 sm:px-6">
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
            {isBql ? "BQL Oceanami" : (butler?.name ?? "Quản gia")}
          </p>
          <h1 className="mt-1 font-serif text-title">Việc hôm nay</h1>
          <div className="mt-4">
            <DateField
              date={opsDate}
              onChange={setPickedDate}
              label="Ngày"
              calendarTitle="Chọn ngày"
              locale={vi}
              formatLabel={(value) => format(parseISO(value), "EEEE d/M/yyyy", { locale: vi })}
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
        </div>

        <Attention
          world={world}
          villaIds={isBql ? villas.map((villa) => villa.id) : scope}
          canHold={isBql}
          onRelease={(id) => run(() => releaseProtectiveHold(id))}
        />

        <BoardSection
          title="Cần chuẩn bị"
          empty="Không còn villa cần chuẩn bị."
          stays={board.prepare}
          role={role}
          emphasize="villa"
          onOpen={setOpenId}
        />
        <BoardSection
          title="Khách đến"
          empty="Không có khách đến."
          stays={board.arriving}
          role={role}
          emphasize="guest"
          onOpen={setOpenId}
        />
        <BoardSection
          title="Khách đi"
          empty="Không có khách đi."
          stays={board.departing}
          role={role}
          emphasize="guest"
          onOpen={setOpenId}
        />
        <BoardSection
          title="Đang ở"
          empty="Không có khách đang ở."
          stays={board.inHouse}
          role={role}
          emphasize="guest"
          onOpen={setOpenId}
        />

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
                  canAct={!isBql && Boolean(butler?.villaIds?.includes(openStay.villaId))}
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
                    {getVilla(sheetStay.villaId)?.name} · {visibleGuestName(sheetStay, role)}. Cần lý do. Không tự ghi khi quá ngày.
                  </p>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Lý do"
                    rows={4}
                    className="mt-4 w-full rounded-xl bg-cream p-3 text-ink outline-none ring-lotus/40 focus:ring-2"
                  />
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>
                      Huỷ
                    </Button>
                    <Button className="flex-1" onClick={submitNoShow} disabled={!reason.trim()}>
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

function BoardSection({
  title,
  empty,
  stays,
  role,
  emphasize,
  onOpen,
}: {
  title: string;
  empty: string;
  stays: Stay[];
  role: RoleSession;
  emphasize: "villa" | "guest";
  onOpen: (stayId: string) => void;
}) {
  return (
    <section className="mx-auto max-w-lg px-4 pt-8 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="text-sm text-muted">{stays.length}</p>
      </div>
      <div className="mt-3 space-y-3">
        {stays.length === 0 ? (
          <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            {empty}
          </p>
        ) : (
          stays.map((stay) => {
            const villa = getVilla(stay.villaId)?.name ?? stay.villaId;
            const guest = visibleGuestName(stay, role);
            const titleText = emphasize === "villa" ? villa : guest;
            const detail = emphasize === "villa" ? guest : villa;
            return (
              <button
                key={`${title}-${stay.id}`}
                type="button"
                onClick={() => onOpen(stay.id)}
                className="w-full rounded-2xl bg-paper p-4 text-left shadow-[var(--shadow-border)]"
              >
                <p className="font-medium">{titleText}</p>
                <p className="mt-1 text-sm text-ink-soft">{detail}</p>
                <p className="mt-2 text-sm text-muted">
                  {stay.guests} khách · {viDateRange(stay.checkIn, stay.checkOut)}
                </p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function Attention({
  world,
  villaIds,
  canHold,
  onRelease,
}: {
  world: { incidents: { id: string; villaId: string; note: string }[]; protectiveHolds?: { id: string; villaId: string; note: string; status: string; reviewDueAt: string }[]; now: string };
  villaIds: string[];
  canHold: boolean;
  onRelease: (id: string) => void;
}) {
  const allowed = new Set(villaIds);
  const incidents = world.incidents.filter((item) => allowed.has(item.villaId));
  const holds = (world.protectiveHolds ?? []).filter(
    (item) => item.status === "ACTIVE" && allowed.has(item.villaId),
  );
  if (incidents.length === 0 && holds.length === 0) return null;
  return (
    <section className="mx-auto max-w-lg px-4 pt-8 sm:px-6">
      <h2 className="font-serif text-2xl">Cần chú ý</h2>
      <div className="mt-3 space-y-3">
        {incidents.map((incident) => (
          <article key={incident.id} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
            <p className="font-medium">{getVilla(incident.villaId)?.name ?? incident.villaId}</p>
            <p className="mt-1 text-sm text-ink-soft">{incident.note}</p>
          </article>
        ))}
        {holds.map((hold) => (
          <article key={hold.id} className="rounded-2xl border-2 border-[#8a5a12] bg-[#f8edd6] p-4">
            <p className="font-medium text-[#6a4310]">
              {getVilla(hold.villaId)?.name ?? hold.villaId} · Giữ bảo vệ
            </p>
            <p className="mt-1 text-sm text-[#6a4310]">{hold.note}</p>
            {hold.reviewDueAt <= world.now ? (
              <p className="mt-2 text-sm font-medium">Đã quá hạn xem lại. Vẫn đang giữ.</p>
            ) : null}
            {canHold ? (
              <Button variant="outline" className="mt-3 w-full" onClick={() => onRelease(hold.id)}>
                Gỡ giữ bảo vệ
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
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

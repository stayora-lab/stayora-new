import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { DateField } from "@/components/dates-guests";
import { Button } from "@/components/ui/button";
import {
  BUTLER_LINH,
  domainMessageVi,
  opsLists,
  stayGuestLabel,
  viDateRange,
} from "@/lib/domain";
import type { Stay } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/ops")({
  component: OpsPage,
});

type Sheet =
  | { kind: "noshow"; stay: Stay }
  | { kind: "incident"; stay: Stay }
  | null;

function OpsPage() {
  const persona = useBookingStore((state) => state.persona);
  const setPersona = useBookingStore((state) => state.setPersona);
  const world = useBookingStore((state) => state.world);
  const opsDate = useBookingStore((state) => state.opsDate);
  const setOpsDate = useBookingStore((state) => state.setOpsDate);
  const butlerCheckIn = useBookingStore((state) => state.butlerCheckIn);
  const butlerCheckOut = useBookingStore((state) => state.butlerCheckOut);
  const butlerNoShow = useBookingStore((state) => state.butlerNoShow);
  const butlerIncident = useBookingStore((state) => state.butlerIncident);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (persona !== "BUTLER" && persona !== "BQL") setPersona("BUTLER");
  }, [persona, setPersona]);

  const isBql = persona === "BQL";
  const butler = world.butlers.find((person) => person.id === BUTLER_LINH);
  const lists = opsLists(world, opsDate);

  function assigned(stay: Stay): boolean {
    return Boolean(butler?.villaIds?.includes(stay.villaId));
  }

  function run(action: () => void) {
    setError(null);
    try {
      action();
    } catch (err) {
      setError(domainMessageVi(err));
    }
  }

  function submitNoShow() {
    if (!sheet || sheet.kind !== "noshow") return;
    if (!reason.trim()) {
      setError("Cần nêu lý do");
      return;
    }
    run(() => butlerNoShow(sheet.stay.id, reason));
    setSheet(null);
    setReason("");
  }

  function submitIncident() {
    if (!sheet || sheet.kind !== "incident") return;
    if (!note.trim()) {
      setError("Cần mô tả sự cố");
      return;
    }
    run(() => butlerIncident(sheet.stay.id, note, hasPhoto));
    setSheet(null);
    setNote("");
    setHasPhoto(false);
  }

  return (
    <main lang="vi" className="pb-20">
      <div className="mx-auto max-w-lg px-4 pt-6 sm:px-6">
        <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
          {isBql ? "BQL Oceanami" : "Butler · Linh"}
        </p>
        <h1 className="mt-1 font-serif text-title">Hôm nay tại Oceanami</h1>
        <div className="mt-4">
          <DateField
            date={opsDate}
            onChange={setOpsDate}
            label="Ngày"
            calendarTitle="Chọn ngày"
            locale={vi}
            formatLabel={(value) => format(parseISO(value), "EEEE d/M/yyyy", { locale: vi })}
          />
        </div>
        {error ? <p className="mt-3 text-sm text-lotus-deep">{error}</p> : null}
        {isBql ? (
          <p className="mt-3 text-sm text-muted">
            Chỉ xem. BQL không đổi Stay, Booking, giá hay thanh toán.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Nút thao tác chỉ hiện với villa được giao cho Linh.
          </p>
        )}
      </div>

      <StayList
        title="Đến hôm nay"
        stays={lists.arriving}
        empty="Không có khách đến."
        canAct={!isBql}
        assigned={assigned}
        onCheckIn={(stay) => run(() => butlerCheckIn(stay.id))}
        onCheckOut={(stay) => run(() => butlerCheckOut(stay.id))}
        onNoShow={(stay) => {
          setError(null);
          setReason("");
          setSheet({ kind: "noshow", stay });
        }}
        onIncident={(stay) => {
          setError(null);
          setNote("");
          setHasPhoto(false);
          setSheet({ kind: "incident", stay });
        }}
      />
      <StayList
        title="Đang ở"
        stays={lists.inHouse}
        empty="Không có khách đang ở."
        canAct={!isBql}
        assigned={assigned}
        onCheckIn={(stay) => run(() => butlerCheckIn(stay.id))}
        onCheckOut={(stay) => run(() => butlerCheckOut(stay.id))}
        onNoShow={(stay) => {
          setError(null);
          setReason("");
          setSheet({ kind: "noshow", stay });
        }}
        onIncident={(stay) => {
          setError(null);
          setNote("");
          setHasPhoto(false);
          setSheet({ kind: "incident", stay });
        }}
      />
      <StayList
        title="Đi hôm nay"
        stays={lists.departing}
        empty="Không có khách trả phòng."
        canAct={!isBql}
        assigned={assigned}
        onCheckIn={(stay) => run(() => butlerCheckIn(stay.id))}
        onCheckOut={(stay) => run(() => butlerCheckOut(stay.id))}
        onNoShow={(stay) => {
          setError(null);
          setReason("");
          setSheet({ kind: "noshow", stay });
        }}
        onIncident={(stay) => {
          setError(null);
          setNote("");
          setHasPhoto(false);
          setSheet({ kind: "incident", stay });
        }}
      />

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
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-10">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            {sheet?.kind === "noshow" ? (
              <>
                <p className="font-serif text-2xl">Khách không đến</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {getVilla(sheet.stay.villaId)?.name} · {sheet.stay.guestName}. Không tự đánh dấu khi
                  quá ngày — cần lý do.
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
            {sheet?.kind === "incident" ? (
              <>
                <p className="font-serif text-2xl">Báo sự cố</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Chỉ tạo hồ sơ sự cố. Không khoá lịch, không đổi Booking.
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
                      <X className="size-4" /> Đã gắn 1 ảnh (placeholder)
                    </>
                  ) : (
                    <>
                      <ImagePlus className="size-4" /> Ảnh — placeholder
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
  );
}

function StayList({
  title,
  stays,
  empty,
  canAct,
  assigned,
  onCheckIn,
  onCheckOut,
  onNoShow,
  onIncident,
}: {
  title: string;
  stays: Stay[];
  empty: string;
  canAct: boolean;
  assigned: (stay: Stay) => boolean;
  onCheckIn: (stay: Stay) => void;
  onCheckOut: (stay: Stay) => void;
  onNoShow: (stay: Stay) => void;
  onIncident: (stay: Stay) => void;
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
          stays.map((stay) => (
            <StayRow
              key={stay.id}
              stay={stay}
              canAct={canAct && assigned(stay)}
              onCheckIn={() => onCheckIn(stay)}
              onCheckOut={() => onCheckOut(stay)}
              onNoShow={() => onNoShow(stay)}
              onIncident={() => onIncident(stay)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function StayRow({
  stay,
  canAct,
  onCheckIn,
  onCheckOut,
  onNoShow,
  onIncident,
}: {
  stay: Stay;
  canAct: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onNoShow: () => void;
  onIncident: () => void;
}) {
  const villa = getVilla(stay.villaId);
  const scheduled = stay.status === "SCHEDULED";
  const inHouse = stay.status === "CHECKED_IN";

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{villa?.name ?? stay.villaId}</p>
          <p className="mt-1 text-sm text-ink-soft">{stay.guestName}</p>
        </div>
        <span className="shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep">
          {stayGuestLabel(stay.status)}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">
        {stay.guests} khách · {viDateRange(stay.checkIn, stay.checkOut)}
      </p>
      <p className="mt-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
        {stay.originLabel}
      </p>
      {canAct ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {scheduled ? (
            <Button className="h-11" onClick={onCheckIn}>
              Nhận phòng
            </Button>
          ) : null}
          {inHouse ? (
            <Button variant="ink" className="h-11" onClick={onCheckOut}>
              Trả phòng
            </Button>
          ) : null}
          {scheduled ? (
            <Button variant="outline" className="h-11" onClick={onNoShow}>
              Khách không đến
            </Button>
          ) : null}
          <Button variant="ghost" className="h-11" onClick={onIncident}>
            Báo sự cố
          </Button>
        </div>
      ) : null}
    </article>
  );
}

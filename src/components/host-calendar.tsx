import { addDays, format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import {
  commitmentCellLabel,
  commitmentsOnDate,
  formatDueAt,
  personaLabel,
  protectiveHoldsOnDate,
  viDateRange,
} from "@/lib/domain";
import type { BlockKind, Commitment, ExternalSource, ProtectiveHold, World } from "@/lib/domain";
import { getVilla, villas as allVillas, type Villa } from "@/lib/villas";
import { visibleGuestName } from "@/lib/privacy";
import { useBookingStore } from "@/lib/store";

const SOURCES: ExternalSource[] = ["Airbnb", "Booking.com", "Agoda", "Zalo", "Khách quen", "Khác"];

type Sheet =
  | { kind: "cell"; villaId: string; date: string; commitments: Commitment[] }
  | { kind: "external"; villaId: string; checkIn: string }
  | { kind: "block"; villaId: string; start: string }
  | null;

function addIso(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

function cellTone(items: Commitment[]): string {
  if (items.length > 1) return "border-2 border-[#b42318] bg-[#fdecea] text-[#7a1f16]";
  const commitment = items[0];
  if (!commitment) return "bg-cream text-muted";
  if (commitment.kind === "HOLD") return "bg-sand text-ink";
  if (commitment.kind === "AVAILABILITY_BLOCK") {
    return commitment.blockKind === "MAINTENANCE"
      ? "bg-ink-soft text-cream"
      : "bg-cream-deep text-ink-soft";
  }
  if (commitment.basis === "EXTERNAL") return "bg-moss/20 text-moss";
  return "bg-lotus-soft text-lotus-deep";
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <span className={`inline-block size-3 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}

export function HostCalendar({
  world,
  villas = allVillas,
  onExternal,
  onBlock,
  onRelease,
  onPlaceHold,
  onReleaseHold,
  composer = true,
}: {
  world: World;
  villas?: Villa[];
  onExternal: (input: {
    villaId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    source: ExternalSource;
    guestName?: string;
  }) => void;
  onBlock: (input: {
    villaId: string;
    start: string;
    end: string;
    blockKind: BlockKind;
    note?: string;
  }) => void;
  onRelease: (commitmentId: string) => void;
  onPlaceHold?: (input: {
    villaId: string;
    start: string;
    end: string;
    note: string;
  }) => void;
  onReleaseHold?: (holdId: string) => void;
  composer?: boolean;
}) {
  const today = world.now.slice(0, 10);
  const [start, setStart] = useState(today);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [source, setSource] = useState<ExternalSource>("Airbnb");
  const [guestName, setGuestName] = useState("");
  const [blockKind, setBlockKind] = useState<BlockKind>("OWNER");
  const [note, setNote] = useState("");
  const dates = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addIso(start, index)),
    [start],
  );

  function openCell(villaId: string, date: string) {
    const commitments = commitmentsOnDate(world, villaId, date);
    setSheet({ kind: "cell", villaId, date, commitments });
    setCheckOut(addIso(date, 2));
    setGuests(2);
    setGuestName("");
    setNote("");
    setSource("Airbnb");
    setBlockKind("OWNER");
  }

  function submitExternal() {
    if (!sheet || (sheet.kind !== "external" && sheet.kind !== "cell")) return;
    const villaId = sheet.villaId;
    const checkIn = sheet.kind === "external" ? sheet.checkIn : sheet.date;
    onExternal({
      villaId,
      checkIn,
      checkOut: checkOut || addIso(checkIn, 2),
      guests,
      source,
      guestName: guestName.trim() || undefined,
    });
    setSheet(null);
  }

  function submitBlock() {
    if (!sheet || (sheet.kind !== "block" && sheet.kind !== "cell")) return;
    const villaId = sheet.villaId;
    const startDate = sheet.kind === "block" ? sheet.start : sheet.date;
    onBlock({
      villaId,
      start: startDate,
      end: checkOut || addIso(startDate, 1),
      blockKind,
      note: note.trim() || undefined,
    });
    setSheet(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6">
        <Button variant="outline" size="sm" onClick={() => setStart(addIso(start, -7))}>
          Trước
        </Button>
        <p className="text-sm text-muted">{viDateRange(dates[0]!, addIso(dates[13]!, 1))}</p>
        <Button variant="outline" size="sm" onClick={() => setStart(addIso(start, 7))}>
          Sau
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 px-4 text-[11px] sm:px-6">
        <Legend swatch="bg-lotus-soft text-lotus-deep" label="Stayora" />
        <Legend swatch="bg-moss/20 text-moss" label="Đặt ngoài" />
        <Legend swatch="bg-sand text-ink" label="Giữ chỗ" />
        <Legend swatch="bg-cream-deep text-ink-soft" label="Chặn" />
        <Legend swatch="bg-ink-soft text-cream" label="Bảo trì" />
        <Legend swatch="border-2 border-[#8a5a12] bg-[#f8edd6]" label="Giữ bảo vệ" />
        <Legend swatch="border-2 border-[#b42318] bg-[#fdecea] text-[#7a1f16]" label="Xung đột" />
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-max border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-28 bg-cream px-3 py-2 text-left text-xs font-semibold tracking-wider text-muted uppercase">
                Villa
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className={`min-w-20 px-1 py-2 text-center text-xs font-medium ${
                    date === today ? "text-lotus" : "text-muted"
                  }`}
                >
                  <span className="block">{format(parseISO(date), "EEE", { locale: vi })}</span>
                  <span className="block text-ink">{format(parseISO(date), "d/M")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {villas.map((villa) => (
              <tr key={villa.id}>
                <th className="sticky left-0 z-10 bg-cream px-3 py-1 text-left text-sm font-medium">
                  {villa.name.replace("Villa ", "")}
                </th>
                {dates.map((date) => {
                  const items = commitmentsOnDate(world, villa.id, date);
                  const holds = protectiveHoldsOnDate(world, villa.id, date);
                  const conflict = items.length > 1;
                  const holdOnly = holds.length > 0 && items.length === 0;
                  const label = conflict
                    ? "Xung đột"
                    : holdOnly
                      ? "Giữ bảo vệ"
                      : items[0]
                        ? commitmentCellLabel(items[0])
                        : "Trống";
                  const tone = conflict
                    ? "border-2 border-[#b42318] bg-[#fdecea] text-[#7a1f16]"
                    : holdOnly
                      ? "border-2 border-[#8a5a12] bg-[#f8edd6] text-[#6a4310]"
                      : holds.length > 0
                        ? `${cellTone(items)} ring-2 ring-[#8a5a12]`
                        : cellTone(items);
                  return (
                    <td key={date} className="p-0.5">
                      <button
                        type="button"
                        onClick={() => openCell(villa.id, date)}
                        className={`flex h-16 w-20 flex-col justify-center rounded-lg px-1.5 text-left text-[11px] leading-tight ${tone}`}
                      >
                        {conflict ? (
                          <span className="mb-0.5 flex items-center gap-0.5 font-semibold">
                            <AlertTriangle className="size-3 shrink-0" />
                            Xung đột
                          </span>
                        ) : (
                          <span className="line-clamp-2">{label}</span>
                        )}
                        {holds.length > 0 && !holdOnly ? (
                          <span className="mt-0.5 font-semibold text-[#6a4310]">Giữ bảo vệ</span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer.Root open={Boolean(sheet)} onOpenChange={(open) => !open && setSheet(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-10">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            {sheet?.kind === "cell" ? (
              sheet.commitments.length === 0 &&
              protectiveHoldsOnDate(world, sheet.villaId, sheet.date).length === 0 ? (
                <EmptyCell
                  villaId={sheet.villaId}
                  date={sheet.date}
                  checkOut={checkOut}
                  setCheckOut={setCheckOut}
                  guests={guests}
                  setGuests={setGuests}
                  source={source}
                  setSource={setSource}
                  guestName={guestName}
                  setGuestName={setGuestName}
                  blockKind={blockKind}
                  setBlockKind={setBlockKind}
                  note={note}
                  setNote={setNote}
                  onExternal={submitExternal}
                  onBlock={submitBlock}
                  onPlaceHold={
                    onPlaceHold
                      ? () => {
                          if (!sheet || sheet.kind !== "cell") return;
                          onPlaceHold({
                            villaId: sheet.villaId,
                            start: sheet.date,
                            end: checkOut || addIso(sheet.date, 1),
                            note: note.trim() || "Đang xem villa",
                          });
                          setSheet(null);
                        }
                      : undefined
                  }
                  composer={composer}
                />
              ) : (
                <OccupiedCell
                  world={world}
                  date={sheet.date}
                  commitments={sheet.commitments}
                  holds={protectiveHoldsOnDate(world, sheet.villaId, sheet.date)}
                  onRelease={(id) => {
                    onRelease(id);
                    setSheet(null);
                  }}
                  onReleaseHold={
                    onReleaseHold
                      ? (id) => {
                          onReleaseHold(id);
                          setSheet(null);
                        }
                      : undefined
                  }
                  onExternal={() =>
                    setSheet({ kind: "external", villaId: sheet.villaId, checkIn: sheet.date })
                  }
                  showExternal={composer && sheet.commitments.length > 0}
                />
              )
            ) : null}
            {sheet?.kind === "external" ? (
              <EmptyCell
                villaId={sheet.villaId}
                date={sheet.checkIn}
                checkOut={checkOut}
                setCheckOut={setCheckOut}
                guests={guests}
                setGuests={setGuests}
                source={source}
                setSource={setSource}
                guestName={guestName}
                setGuestName={setGuestName}
                blockKind={blockKind}
                setBlockKind={setBlockKind}
                note={note}
                setNote={setNote}
                onExternal={submitExternal}
                only="external"
              />
            ) : null}
            {sheet?.kind === "block" ? (
              <EmptyCell
                villaId={sheet.villaId}
                date={sheet.start}
                checkOut={checkOut}
                setCheckOut={setCheckOut}
                guests={guests}
                setGuests={setGuests}
                source={source}
                setSource={setSource}
                guestName={guestName}
                setGuestName={setGuestName}
                blockKind={blockKind}
                setBlockKind={setBlockKind}
                note={note}
                setNote={setNote}
                onBlock={submitBlock}
                only="block"
              />
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function OccupiedCell({
  world,
  date,
  commitments,
  holds,
  onRelease,
  onReleaseHold,
  onExternal,
  showExternal,
}: {
  world: World;
  date: string;
  commitments: Commitment[];
  holds: ProtectiveHold[];
  onRelease: (id: string) => void;
  onReleaseHold?: (id: string) => void;
  onExternal: () => void;
  showExternal: boolean;
}) {
  const conflict = commitments.length > 1;
  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
        {conflict ? "Xung đột" : holds.length ? "Giữ bảo vệ" : "Chi tiết ô"}
      </p>
      <h2 className="mt-1 font-serif text-2xl">{format(parseISO(date), "EEEE d/M", { locale: vi })}</h2>
      {conflict ? (
        <p className="mt-2 text-sm text-lotus-deep">
          Hai chỗ cùng lúc. Stayora vận hành sẽ xử lý — không tự chọn bên thắng.
        </p>
      ) : null}
      {holds.length > 0 ? (
        <div className="mt-4 space-y-3">
          {holds.map((hold) => (
            <article key={hold.id} className="rounded-2xl border-2 border-[#8a5a12] bg-[#f8edd6] p-4">
              <p className="font-medium text-[#6a4310]">Giữ bảo vệ</p>
              <p className="mt-1 text-sm text-[#6a4310]">
                Đang xem villa. Đặt chỗ đang có vẫn giữ. Không phải bảo trì.
              </p>
              <p className="mt-2 text-sm">{hold.note}</p>
              <p className="mt-1 text-sm text-muted">{viDateRange(hold.start, hold.end)}</p>
              {hold.reviewDueAt <= world.now ? (
                <p className="mt-2 text-sm font-medium text-[#6a4310]">Đã quá hạn xem lại. Vẫn đang giữ.</p>
              ) : null}
              {onReleaseHold ? (
                <Button variant="outline" className="mt-4 w-full" onClick={() => onReleaseHold(hold.id)}>
                  Gỡ giữ bảo vệ
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {commitments.map((commitment) => (
          <CommitmentDetail key={commitment.id} world={world} commitment={commitment} onRelease={onRelease} />
        ))}
      </div>
      {showExternal ? (
        <Button variant="outline" className="mt-5 w-full" onClick={onExternal}>
          Ghi đặt ngoài chồng lên
        </Button>
      ) : null}
    </div>
  );
}

function CommitmentDetail({
  world,
  commitment,
  onRelease,
}: {
  world: World;
  commitment: Commitment;
  onRelease: (id: string) => void;
}) {
  const villa = getVilla(commitment.villaId);
  const booking = commitment.bookingId
    ? world.bookings.find((item) => item.id === commitment.bookingId)
    : undefined;
  const stay = commitment.stayId
    ? world.stays.find((item) => item.id === commitment.stayId)
    : world.stays.find((item) => item.bookingId === commitment.bookingId);
  const hostId = useBookingStore((state) => state.hostId);
  const guestLabel = stay
    ? visibleGuestName(stay, { persona: "HOST", hostId })
    : null;
  return (
    <article className="rounded-2xl bg-cream p-4">
      <p className="font-medium">{commitmentCellLabel(commitment)}</p>
      <p className="mt-1 text-sm text-muted">{villa?.name}</p>
      <p className="mt-2 text-sm">
        {viDateRange(commitment.start, commitment.end)}
        {stay ? ` · ${guestLabel} · ${stay.guests} khách` : null}
      </p>
      <dl className="mt-3 space-y-1 text-sm text-ink-soft">
        <div>Nguồn: {commitment.source ?? (commitment.basis === "STAYORA_BOOKING" ? "Stayora" : commitment.blockKind ?? "—")}</div>
        <div>Mã: {commitment.reference ?? booking?.reference ?? "—"}</div>
        <div>Tạo bởi: {commitment.createdBy ? personaLabel(commitment.createdBy) : "—"}</div>
        <div>Lúc: {commitment.createdAt ? formatDueAt(commitment.createdAt) : "—"}</div>
        {commitment.note ? <div>Ghi chú: {commitment.note}</div> : null}
      </dl>
      {commitment.kind === "AVAILABILITY_BLOCK" ? (
        <Button variant="outline" className="mt-4 w-full" onClick={() => onRelease(commitment.id)}>
          Mở lại lịch
        </Button>
      ) : null}
    </article>
  );
}

function EmptyCell({
  villaId,
  date,
  checkOut,
  setCheckOut,
  guests,
  setGuests,
  source,
  setSource,
  guestName,
  setGuestName,
  blockKind,
  setBlockKind,
  note,
  setNote,
  onExternal,
  onBlock,
  onPlaceHold,
  composer = true,
  only,
}: {
  villaId: string;
  date: string;
  checkOut: string;
  setCheckOut: (value: string) => void;
  guests: number;
  setGuests: (value: number) => void;
  source: ExternalSource;
  setSource: (value: ExternalSource) => void;
  guestName: string;
  setGuestName: (value: string) => void;
  blockKind: BlockKind;
  setBlockKind: (value: BlockKind) => void;
  note: string;
  setNote: (value: string) => void;
  onExternal?: () => void;
  onBlock?: () => void;
  onPlaceHold?: () => void;
  composer?: boolean;
  only?: "external" | "block";
}) {
  const villa = getVilla(villaId);
  const [mode, setMode] = useState<"external" | "block" | "protect">(
    only ?? (composer ? "external" : "protect"),
  );
  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Trống</p>
      <h2 className="mt-1 font-serif text-2xl">{villa?.name}</h2>
      <p className="mt-1 text-sm text-muted">
        Từ {format(parseISO(date), "d/M")} · chọn ngày đi
      </p>
      {!only && composer ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button
            variant={mode === "external" ? "primary" : "outline"}
            onClick={() => setMode("external")}
          >
            Đặt ngoài
          </Button>
          <Button variant={mode === "block" ? "primary" : "outline"} onClick={() => setMode("block")}>
            Chặn lịch
          </Button>
          {onPlaceHold ? (
            <Button
              variant={mode === "protect" ? "primary" : "outline"}
              onClick={() => setMode("protect")}
            >
              Giữ bảo vệ
            </Button>
          ) : null}
        </div>
      ) : null}

      <label className="mt-4 block text-sm">
        Ngày đi
        <input
          type="date"
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
          className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
        />
      </label>

      {mode === "protect" && onPlaceHold ? (
        <>
          <label className="mt-3 block text-sm">
            Việc đang xem
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
            />
          </label>
          <p className="mt-2 text-xs text-muted">
            Tạm giữ ngày này để xem villa. Đặt chỗ đang có không bị xoá. Không phải bảo trì.
          </p>
          <Button className="mt-5 w-full" onClick={onPlaceHold}>
            Giữ bảo vệ
          </Button>
        </>
      ) : mode === "external" ? (
        <>
          <label className="mt-3 block text-sm">
            Nguồn
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as ExternalSource)}
              className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
            >
              {SOURCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm">
            Tên khách (không bắt buộc)
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
            />
          </label>
          <label className="mt-3 block text-sm">
            Số khách
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value) || 1)}
              className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
            />
          </label>
          <p className="mt-2 text-xs text-muted">Không hỏi giá, doanh thu hay thanh toán.</p>
          <Button className="mt-5 w-full" onClick={onExternal}>
            Ghi đặt ngoài
          </Button>
        </>
      ) : (
        <>
          <label className="mt-3 block text-sm">
            Loại chặn
            <select
              value={blockKind}
              onChange={(event) => setBlockKind(event.target.value as BlockKind)}
              className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
            >
              <option value="OWNER">Chủ nhà chặn</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
          </label>
          <label className="mt-3 block text-sm">
            Ghi chú
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
            />
          </label>
          <Button className="mt-5 w-full" onClick={onBlock}>
            Chặn lịch
          </Button>
        </>
      )}
    </div>
  );
}

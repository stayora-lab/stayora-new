import { createFileRoute } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useMemo, useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { RoleGate } from "@/components/site-chrome";
import { DateRangeField, FieldSplit, GuestField } from "@/components/dates-guests";
import { Photo, VillaPlaceholder } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import {
  holdCountdown,
  isAvailable,
  paymentLinkText,
  paymentPlanLabel,
  quoteText,
  requestStatusVi,
  commissionStatusVi,
  SALE_MAI,
  viDateRange,
  domainMessageVi,
} from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { formatVnd, isIsoDate, nightsBetween } from "@/lib/stay";
import { villas, type Villa } from "@/lib/villas";

export const Route = createFileRoute("/sale")({
  component: SalePage,
});

type SaleTab = "search" | "requests" | "income";

const TABS: { id: SaleTab; label: string }[] = [
  { id: "search", label: "Tìm villa" },
  { id: "requests", label: "Yêu cầu của tôi" },
  { id: "income", label: "Thu nhập" },
];

function SalePage() {
  const saleId = useBookingStore((state) => state.saleId) ?? SALE_MAI;
  const world = useBookingStore((state) => state.world);
  const search = useBookingStore((state) => state.saleSearch);
  const setSaleSearch = useBookingStore((state) => state.setSaleSearch);
  const saleCreateRequest = useBookingStore((state) => state.saleCreateRequest);
  const [tab, setTab] = useState<SaleTab>("search");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<Villa | null>(null);
  const [guestName, setGuestName] = useState("");
  const clock = parseISO(world.now);

  const ready =
    isIsoDate(search.checkIn) &&
    isIsoDate(search.checkOut) &&
    nightsBetween(search.checkIn, search.checkOut) >= 1;
  const nights = ready ? nightsBetween(search.checkIn, search.checkOut) : 0;
  const evaluatedAt = world.now;

  const grouped = useMemo(() => {
    if (!ready) {
      return { open: [] as Villa[], closed: villas };
    }
    const open: Villa[] = [];
    const closed: Villa[] = [];
    for (const villa of villas) {
      if (isAvailable(world, villa.id, search.checkIn, search.checkOut)) open.push(villa);
      else closed.push(villa);
    }
    return { open, closed };
  }, [world, search.checkIn, search.checkOut, ready]);

  const myRequests = world.requests.filter((item) => item.saleId === saleId);
  const myCommissions = world.commissions.filter((item) => item.saleId === saleId);

  async function copyQuote(villa: Villa) {
    if (!ready) return;
    const origin = `${window.location.origin}/villas/${villa.id}`;
    const total = villa.nightly * nights;
    const text = quoteText({
      villaId: villa.id,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      guests: search.guests,
      total,
      paymentLabel: paymentPlanLabel(total, search.checkIn, evaluatedAt),
      origin,
    });
    const ok = await copyText(text);
    setCopied(ok ? `quote-${villa.id}` : null);
    window.setTimeout(() => setCopied(null), 2200);
  }

  async function copyPayment(requestId: string) {
    const request = world.requests.find((item) => item.id === requestId);
    if (!request) return;
    const text = paymentLinkText(request, window.location.origin);
    const ok = await copyText(text);
    setCopied(ok ? `pay-${requestId}` : null);
    window.setTimeout(() => setCopied(null), 2200);
  }

  async function submitRequest() {
    if (!creating || !ready) return;
    setError(null);
    try {
      await saleCreateRequest({
        villaId: creating.id,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guests: search.guests,
        guestName: guestName.trim() || "Khách",
      });
      setCreating(null);
      setGuestName("");
      setTab("requests");
    } catch (err) {
      setError(domainMessageVi(err));
    }
  }

  return (
    <RoleGate allow={["SALE"]}>
    <main lang="vi" className="pb-24">
      <div className="border-b border-border bg-cream">
        <div className="mx-auto max-w-lg px-4 pt-6 pb-4 sm:px-6">
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Sale · Oceanami</p>
          <h1 className="mt-1 font-serif text-title">Tìm chỗ trống, gửi khách, theo hoa hồng.</h1>
        </div>
        <div className="sticky top-16 z-20 border-t border-border bg-cream/95 backdrop-blur-md">
          <div className="mx-auto grid max-w-lg grid-cols-3 px-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`h-12 text-sm font-medium ${
                  tab === item.id
                    ? "border-b-2 border-ink text-ink"
                    : "border-b-2 border-transparent text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "search" ? (
        <section className="mx-auto max-w-lg px-4 pt-5 sm:px-6">
          <form
            className="rounded-2xl bg-paper p-2 shadow-[var(--shadow-border)]"
            onSubmit={(event) => event.preventDefault()}
          >
            <FieldSplit>
              <DateRangeField
                checkIn={search.checkIn}
                checkOut={search.checkOut}
                onChange={(next) => setSaleSearch(next)}
                datesLabel="Ngày"
                calendarTitle="Ngày đến và ngày đi"
                placeholder="Chọn ngày"
                formatLabel={viDateRange}
                locale={vi}
              />
              <GuestField
                guests={search.guests}
                onChange={(guests) => setSaleSearch({ guests })}
                label="Số khách"
                heading="Bao nhiêu khách?"
                peopleLabel="Khách"
                peopleHint="Tất cả người ở villa."
                doneLabel="Xong"
                valueLabel={(count) => `${count} khách`}
              />
            </FieldSplit>
          </form>
          <p className="mt-3 text-sm text-muted">
            {ready
              ? `${nights} đêm · ${search.guests} khách · giá công khai, cùng giá khách thấy.`
              : "Chọn ngày đến và đi."}
          </p>

          <Group
            title="Trống"
            count={grouped.open.length}
            empty="Không có villa trống cho ngày này."
          >
            {grouped.open.map((villa) => (
              <SaleVillaRow
                key={villa.id}
                villa={villa}
                open
                nights={nights}
                guests={search.guests}
                ready={ready}
                planLabel={
                  ready
                    ? paymentPlanLabel(villa.nightly * nights, search.checkIn, evaluatedAt)
                    : ""
                }
                copied={copied === `quote-${villa.id}`}
                onQuote={() => void copyQuote(villa)}
                onCreate={() => {
                  setError(null);
                  setGuestName("");
                  setCreating(villa);
                }}
              />
            ))}
          </Group>

          <Group
            title="Không trống"
            count={grouped.closed.length}
            empty="Mọi villa đều trống."
          >
            {grouped.closed.map((villa) => (
              <SaleVillaRow
                key={villa.id}
                villa={villa}
                open={false}
                nights={nights}
                guests={search.guests}
                ready={ready}
                planLabel={
                  ready
                    ? paymentPlanLabel(villa.nightly * nights, search.checkIn, evaluatedAt)
                    : ""
                }
                copied={false}
                onQuote={() => void copyQuote(villa)}
                onCreate={() => undefined}
              />
            ))}
          </Group>
        </section>
      ) : null}

      {tab === "requests" ? (
        <section className="mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6">
          {myRequests.length === 0 ? (
            <Empty>Chưa có yêu cầu. Tạo từ tab Tìm villa.</Empty>
          ) : (
            myRequests.map((request) => {
              const villa = villas.find((item) => item.id === request.villaId);
              const booking = world.bookings.find((item) => item.requestId === request.id);
              return (
                <article
                  key={request.id}
                  className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{villa?.name ?? request.villaId}</p>
                      <p className="text-sm text-muted">
                        {viDateRange(request.checkIn, request.checkOut)} · {request.guests} khách
                      </p>
                    </div>
                    <StatusPill>
                      {booking ? "Đã xác nhận" : requestStatusVi(request.status)}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm">
                    {request.guestName}
                    <span className="text-muted"> · {formatVnd(request.total)}</span>
                  </p>
                  {request.status === "ACCEPTED" && !booking && request.holdExpiresAt ? (
                    <div className="mt-4 rounded-xl bg-lotus-soft p-3">
                      <p className="text-sm font-medium text-lotus-deep">
                        Giữ chỗ còn {holdCountdown(request.holdExpiresAt, clock)}
                      </p>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => void copyPayment(request.id)}
                      >
                        {copied === `pay-${request.id}` ? "Đã sao chép" : "Copy link thanh toán"}
                      </Button>
                    </div>
                  ) : null}
                  {booking ? (
                    <p className="mt-3 text-sm text-muted">
                      Mã đặt{" "}
                      <span className="font-medium text-ink">{booking.reference}</span>
                    </p>
                  ) : null}
                  {request.status === "PENDING" ? (
                    <p className="mt-3 text-sm text-muted">
                      Đã gửi Host. Sale không xác nhận giúp khách.
                    </p>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      ) : null}

      {tab === "income" ? (
        <section className="mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6">
          <p className="text-sm text-muted">
            Hoa hồng dự kiến = 10% tiền phòng. Không gồm payout của Host.
          </p>
          {myCommissions.length === 0 ? (
            <Empty>Chưa có hoa hồng.</Empty>
          ) : (
            myCommissions.map((item) => {
              const booking = world.bookings.find((row) => row.id === item.bookingId);
              const villa = villas.find((row) => row.id === booking?.villaId);
              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{villa?.name ?? booking?.villaId}</p>
                      <p className="text-sm text-muted">
                        {booking
                          ? `${viDateRange(booking.checkIn, booking.checkOut)} · ${booking.guestName}`
                          : item.bookingId}
                      </p>
                    </div>
                    <StatusPill>{commissionStatusVi(item.status)}</StatusPill>
                  </div>
                  <p className="mt-4 text-xs font-semibold tracking-wider text-muted uppercase">
                    Hoa hồng dự kiến
                  </p>
                  <p className="mt-1 font-serif text-2xl tabular-nums">{formatVnd(item.amount)}</p>
                  <p className="mt-1 text-sm text-muted">
                    Tạm tính — cơ sở tính hoa hồng chưa chốt
                  </p>
                </article>
              );
            })
          )}
        </section>
      ) : null}

      <Drawer.Root open={Boolean(creating)} onOpenChange={(open) => !open && setCreating(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-10">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            <p className="font-serif text-2xl">Tạo yêu cầu</p>
            {creating && ready ? (
              <p className="mt-2 text-sm text-ink-soft">
                {creating.name} · {viDateRange(search.checkIn, search.checkOut)} · {search.guests}{" "}
                khách · {formatVnd(creating.nightly * nights)} · thanh toán{" "}
                {paymentPlanLabel(creating.nightly * nights, search.checkIn, evaluatedAt)}
              </p>
            ) : null}
            <label className="mt-5 block">
              <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                Tên khách
              </span>
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Nguyễn An"
                className="mt-2 h-12 w-full rounded-xl bg-cream px-4 text-ink outline-none ring-lotus/40 focus:ring-2"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-lotus-deep">{error}</p> : null}
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCreating(null)}>
                Huỷ
              </Button>
              <Button className="flex-1" onClick={submitRequest} disabled={!creating || !ready}>
                Gửi Host
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
    </RoleGate>
  );
}

function Group({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="text-sm text-muted">{count}</p>
      </div>
      <div className="mt-3 space-y-3">
        {count === 0 ? <Empty>{empty}</Empty> : children}
      </div>
    </div>
  );
}

function SaleVillaRow({
  villa,
  open,
  nights,
  guests,
  ready,
  planLabel,
  copied,
  onQuote,
  onCreate,
}: {
  villa: Villa;
  open: boolean;
  nights: number;
  guests: number;
  ready: boolean;
  planLabel: string;
  copied: boolean;
  onQuote: () => void;
  onCreate: () => void;
}) {
  const hero = villa.images[0];
  const overCapacity = guests > villa.sleeps;
  const canCreate = open && ready && !overCapacity;
  const total = nights * villa.nightly;

  return (
    <article className="overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]">
      <div className="flex gap-3 p-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
          {hero ? <Photo src={hero.src} alt="Ảnh minh hoạ" /> : <VillaPlaceholder name={villa.name} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium">{villa.name}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                open ? "bg-lotus-soft text-lotus-deep" : "bg-sand text-muted"
              }`}
            >
              {open ? "Trống" : "Không trống"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">Ngủ {villa.sleeps}</p>
          {ready ? (
            <p className="mt-2 text-sm">
              <span className="font-semibold tabular-nums">{formatVnd(total)}</span>
              <span className="text-muted"> · {planLabel}</span>
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        <Button variant="outline" size="sm" className="h-11" disabled={!ready} onClick={onQuote}>
          {copied ? "Đã sao chép" : "Gửi cho khách"}
        </Button>
        <Button
          size="sm"
          className="h-11"
          disabled={!canCreate}
          onClick={onCreate}
        >
          Tạo yêu cầu
        </Button>
      </div>
      {open && overCapacity ? (
        <p className="px-3 pb-3 text-xs text-muted">Ngủ tối đa {villa.sleeps} — không tạo được cho {guests} khách.</p>
      ) : null}
    </article>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep">
      {children}
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
      {children}
    </p>
  );
}

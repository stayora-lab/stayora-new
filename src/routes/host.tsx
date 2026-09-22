import { createFileRoute } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  balanceLine,
  domainMessageVi,
  holdCountdown,
  obligationSucceeded,
  paymentPlanLabel,
  requestStatusVi,
  viDateRange,
} from "@/lib/domain";
import type { PaymentObligation, PaymentOutcome, StayRequest } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { formatVnd } from "@/lib/stay";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/host")({
  component: HostPage,
});

const DEMO_PAY_LABEL = "Ghi nhận thanh toán (demo — sau này do Stayora xác minh)";

function HostPage() {
  const persona = useBookingStore((state) => state.persona);
  const setPersona = useBookingStore((state) => state.setPersona);
  const world = useBookingStore((state) => state.world);
  const hostAccept = useBookingStore((state) => state.hostAccept);
  const hostRecordPayment = useBookingStore((state) => state.hostRecordPayment);
  const hostResolveUnknown = useBookingStore((state) => state.hostResolveUnknown);
  const advanceDemo = useBookingStore((state) => state.advanceDemo);
  const [error, setError] = useState<string | null>(null);
  const clock = parseISO(world.now);
  const refundCases = world.refundCases ?? [];

  useEffect(() => {
    if (persona !== "HOST") setPersona("HOST");
  }, [persona, setPersona]);

  const pending = world.requests.filter((item) => item.status === "PENDING");
  const holding = world.requests.filter(
    (item) =>
      item.status === "ACCEPTED" &&
      !world.bookings.some((booking) => booking.requestId === item.id),
  );
  const bookedRequests = world.requests.filter((item) =>
    world.bookings.some((booking) => booking.requestId === item.id),
  );
  const occupancyBookings = world.bookings.filter(
    (booking) => !world.requests.some((request) => request.id === booking.requestId),
  );
  const openRefunds = refundCases.filter((item) => item.status === "OPEN");

  function run(action: () => void) {
    setError(null);
    try {
      action();
    } catch (err) {
      setError(domainMessageVi(err));
    }
  }

  return (
    <main lang="vi" className="mx-auto max-w-lg px-4 pt-6 pb-20 sm:px-6">
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Host · Oceanami</p>
      <h1 className="mt-1 font-serif text-title">Yêu cầu cần xử lý</h1>
      <p className="mt-3 text-sm text-muted">
        Chỉ Host chấp nhận. Thanh toán được ghi nhận tại đây — khách không tự xác nhận.
      </p>
      <div className="mt-4">
        <Button variant="outline" className="w-full" onClick={() => run(() => advanceDemo())}>
          Tua nhanh 30 phút
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-lotus-deep">{error}</p> : null}

      <Section title="Chờ chấp nhận" count={pending.length} empty="Không có yêu cầu mới.">
        {pending.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            clock={clock}
            action={
              <Button className="w-full" onClick={() => run(() => hostAccept(request.id))}>
                Chấp nhận · giữ 30 phút
              </Button>
            }
          />
        ))}
      </Section>

      <Section title="Đang giữ chỗ" count={holding.length} empty="Không có chỗ đang giữ.">
        {holding.map((request) => {
          const initial = world.obligations.find(
            (item) => item.requestId === request.id && item.kind === "INITIAL",
          );
          const unknown = world.attempts.find(
            (item) => item.obligationId === initial?.id && item.status === "UNKNOWN",
          );
          return (
            <RequestCard
              key={request.id}
              request={request}
              clock={clock}
              extra={
                initial ? (
                  <p className="mt-3 text-sm">Cần thu {formatVnd(initial.amount)}</p>
                ) : null
              }
              action={
                unknown && initial ? (
                  <ResolveUnknown
                    onResolve={(outcome) => run(() => hostResolveUnknown(unknown.id, outcome))}
                  />
                ) : initial ? (
                  <PaymentButtons
                    onRecord={(outcome) => run(() => hostRecordPayment(initial.id, outcome))}
                  />
                ) : null
              }
            />
          );
        })}
      </Section>

      <Section
        title="Đã xác nhận"
        count={bookedRequests.length + occupancyBookings.length}
        empty="Chưa có booking."
      >
        {bookedRequests.map((request) => {
          const balance = world.obligations.find(
            (item) => item.requestId === request.id && item.kind === "BALANCE",
          );
          const unknown = world.attempts.find(
            (item) => item.obligationId === balance?.id && item.status === "UNKNOWN",
          );
          const paid = balance ? obligationSucceeded(world, balance.id) : false;
          return (
            <RequestCard
              key={request.id}
              request={request}
              clock={clock}
              booked
              extra={
                <>
                  <p className="mt-3 text-sm text-muted">
                    Mã{" "}
                    <span className="font-medium text-ink">
                      {world.bookings.find((item) => item.requestId === request.id)?.reference}
                    </span>
                  </p>
                  {balance ? <BalanceStatus obligation={balance} paid={paid} /> : null}
                </>
              }
              action={
                !balance ? null : unknown ? (
                  <ResolveUnknown
                    onResolve={(outcome) => run(() => hostResolveUnknown(unknown.id, outcome))}
                  />
                ) : paid ? null : (
                  <PaymentButtons
                    onRecord={(outcome) => run(() => hostRecordPayment(balance.id, outcome))}
                  />
                )
              }
            />
          );
        })}
        {occupancyBookings.map((booking) => (
          <article
            key={booking.id}
            className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
          >
            <p className="font-medium">{getVilla(booking.villaId)?.name ?? booking.villaId}</p>
            <p className="mt-1 text-sm text-ink-soft">{booking.guestName}</p>
            <p className="mt-3 text-sm text-muted">
              {viDateRange(booking.checkIn, booking.checkOut)} · {booking.guests} khách
            </p>
            <p className="mt-3 text-sm text-muted">
              Mã <span className="font-medium text-ink">{booking.reference}</span>
            </p>
          </article>
        ))}
      </Section>

      <Section title="Cần hoàn tiền" count={openRefunds.length} empty="Không có khoản cần hoàn.">
        {openRefunds.map((refund) => {
          const request = world.requests.find((item) => item.id === refund.requestId);
          const villa = request ? getVilla(request.villaId) : undefined;
          return (
            <article
              key={refund.id}
              className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{villa?.name ?? request?.villaId ?? refund.requestId}</p>
                  <p className="mt-1 text-sm text-ink-soft">{request?.guestName ?? "Khách"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep">
                  Mở
                </span>
              </div>
              <p className="mt-3 font-semibold tabular-nums">{formatVnd(refund.amount)}</p>
              <p className="mt-1 text-sm text-muted">Hết hạn giữ chỗ</p>
            </article>
          );
        })}
      </Section>
    </main>
  );
}

function BalanceStatus({
  obligation,
  paid,
}: {
  obligation: PaymentObligation;
  paid: boolean;
}) {
  return (
    <p className={`mt-3 text-sm ${paid ? "text-ink-soft" : "text-lotus-deep"}`}>
      {balanceLine(obligation, paid)}
    </p>
  );
}

function PaymentButtons({ onRecord }: { onRecord: (outcome: PaymentOutcome) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Kết quả thanh toán</p>
      <p className="text-xs text-muted">{DEMO_PAY_LABEL}</p>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["SUCCEEDED", "Thành công"],
            ["FAILED", "Thất bại"],
            ["UNKNOWN", "Không xác định"],
          ] as [PaymentOutcome, string][]
        ).map(([outcome, label]) => (
          <Button
            key={outcome}
            size="sm"
            variant={outcome === "SUCCEEDED" ? "primary" : "outline"}
            className="h-11 px-2 text-xs"
            onClick={() => onRecord(outcome)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ResolveUnknown({
  onResolve,
}: {
  onResolve: (outcome: "SUCCEEDED" | "FAILED") => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-lotus-deep">
        Chưa xác định được kết quả thanh toán. Đừng thanh toán lại.
      </p>
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Gỡ không xác định</p>
      <p className="text-xs text-muted">{DEMO_PAY_LABEL}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button className="w-full" onClick={() => onResolve("SUCCEEDED")}>
          Thành công
        </Button>
        <Button variant="outline" className="w-full" onClick={() => onResolve("FAILED")}>
          Thất bại
        </Button>
      </div>
    </div>
  );
}

function Section({
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
    <section className="pt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="text-sm text-muted">{count}</p>
      </div>
      <div className="mt-3 space-y-3">
        {count === 0 ? (
          <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function RequestCard({
  request,
  clock,
  action,
  extra,
  booked,
}: {
  request: StayRequest;
  clock: Date;
  action?: ReactNode;
  extra?: ReactNode;
  booked?: boolean;
}) {
  const villa = getVilla(request.villaId);
  const source = request.source === "SALE" ? "Sale · Mai" : "Khách trực tiếp";
  const plan = paymentPlanLabel(request.total, request.checkIn, request.createdAt);

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{villa?.name ?? request.villaId}</p>
          <p className="mt-1 text-sm text-ink-soft">{request.guestName}</p>
        </div>
        <span className="shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep">
          {booked ? "Đã xác nhận" : requestStatusVi(request.status)}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">
        {viDateRange(request.checkIn, request.checkOut)} · {request.guests} khách
      </p>
      <p className="mt-1 text-sm">
        <span className="font-semibold tabular-nums">{formatVnd(request.total)}</span>
        <span className="text-muted"> · {plan}</span>
      </p>
      <p className="mt-2 text-xs font-medium tracking-wide text-ink-soft uppercase">{source}</p>
      {!booked && request.status === "ACCEPTED" && request.holdExpiresAt ? (
        <p className="mt-3 text-sm text-lotus-deep">
          Giữ còn {holdCountdown(request.holdExpiresAt, clock)}
        </p>
      ) : null}
      {extra}
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}

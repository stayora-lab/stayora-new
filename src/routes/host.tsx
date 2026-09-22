import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  domainMessageVi,
  holdCountdown,
  paymentRuleLabel,
  requestStatusVi,
  viDateRange,
} from "@/lib/domain";
import type { StayRequest } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { formatVnd } from "@/lib/stay";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/host")({
  component: HostPage,
});

function HostPage() {
  const persona = useBookingStore((state) => state.persona);
  const setPersona = useBookingStore((state) => state.setPersona);
  const world = useBookingStore((state) => state.world);
  const hostAccept = useBookingStore((state) => state.hostAccept);
  const hostConfirm = useBookingStore((state) => state.hostConfirm);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (persona !== "HOST") setPersona("HOST");
  }, [persona, setPersona]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const pending = world.requests.filter((item) => item.status === "PENDING");
  const accepted = world.requests.filter((item) => item.status === "ACCEPTED");
  const confirmed = world.requests.filter((item) => item.status === "CONFIRMED");

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
        Chỉ Host chấp nhận và xác nhận. Sale không giữ chỗ giúp khách.
      </p>
      {error ? <p className="mt-3 text-sm text-lotus-deep">{error}</p> : null}

      <Section title="Chờ chấp nhận" count={pending.length} empty="Không có yêu cầu mới.">
        {pending.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            now={now}
            action={
              <Button className="w-full" onClick={() => run(() => hostAccept(request.id))}>
                Chấp nhận · giữ 24 giờ
              </Button>
            }
          />
        ))}
      </Section>

      <Section title="Đang giữ chỗ" count={accepted.length} empty="Không có chỗ đang giữ.">
        {accepted.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            now={now}
            action={
              <Button className="w-full" onClick={() => run(() => hostConfirm(request.id))}>
                Xác nhận đặt
              </Button>
            }
          />
        ))}
      </Section>

      <Section title="Đã xác nhận" count={confirmed.length} empty="Chưa có booking.">
        {confirmed.map((request) => (
          <RequestCard key={request.id} request={request} now={now} />
        ))}
      </Section>
    </main>
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
  now,
  action,
}: {
  request: StayRequest;
  now: Date;
  action?: ReactNode;
}) {
  const villa = getVilla(request.villaId);
  const source = request.source === "SALE" ? "Sale · Mai" : "Khách trực tiếp";

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{villa?.name ?? request.villaId}</p>
          <p className="mt-1 text-sm text-ink-soft">{request.guestName}</p>
        </div>
        <span className="shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep">
          {requestStatusVi(request.status)}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">
        {viDateRange(request.checkIn, request.checkOut)} · {request.guests} khách
      </p>
      <p className="mt-1 text-sm">
        <span className="font-semibold tabular-nums">{formatVnd(request.total)}</span>
        <span className="text-muted"> · {paymentRuleLabel(request.paymentRule)}</span>
      </p>
      <p className="mt-2 text-xs font-medium tracking-wide text-ink-soft uppercase">{source}</p>
      {request.status === "ACCEPTED" && request.holdExpiresAt ? (
        <p className="mt-3 text-sm text-lotus-deep">
          Giữ còn {holdCountdown(request.holdExpiresAt, now)}
        </p>
      ) : null}
      {request.reference ? (
        <p className="mt-3 text-sm text-muted">
          Mã <span className="font-medium text-ink">{request.reference}</span>
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}

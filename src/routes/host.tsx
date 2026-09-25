import { createFileRoute } from "@tanstack/react-router";
import { parseISO } from "date-fns";
import { useState, type ReactNode } from "react";
import { RoleGate } from "@/components/site-chrome";
import { HostCalendar } from "@/components/host-calendar";
import { Button } from "@/components/ui/button";
import {
  balanceLine,
  domainMessageVi,
  holdCountdown,
  hostPaymentStatus,
  hostToday,
  paymentPlanLabel,
  requestStatusVi,
  stayGuestLabel,
  viDateRange,
} from "@/lib/domain";
import type { StayRequest } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { formatVnd } from "@/lib/stay";
import { getVilla, villas, villasForHost } from "@/lib/villas";
import { visibleGuestName } from "@/lib/privacy";

export const Route = createFileRoute("/host")({
  component: HostPage,
});

type HostTab = "today" | "calendar" | "requests" | "stays";

const TABS: { id: HostTab; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "calendar", label: "Lịch" },
  { id: "requests", label: "Yêu cầu" },
  { id: "stays", label: "Đặt chỗ & lưu trú" },
];

function HostPage() {
  const hostId = useBookingStore((state) => state.hostId);
  const grants = useBookingStore((state) => state.grants);
  const world = useBookingStore((state) => state.world);
  const hostAccept = useBookingStore((state) => state.hostAccept);
  const hostExternal = useBookingStore((state) => state.hostExternal);
  const hostRecordFact = useBookingStore((state) => state.hostRecordFact);
  const hostEstablishExternal = useBookingStore((state) => state.hostEstablishExternal);
  const hostCreateBlock = useBookingStore((state) => state.hostCreateBlock);
  const hostReleaseBlock = useBookingStore((state) => state.hostReleaseBlock);
  const reportIncident = useBookingStore((state) => state.reportIncident);
  const placeProtectiveHold = useBookingStore((state) => state.placeProtectiveHold);
  const releaseProtectiveHold = useBookingStore((state) => state.releaseProtectiveHold);
  const recordMaintenanceFromHold = useBookingStore((state) => state.recordMaintenanceFromHold);
  const [tab, setTab] = useState<HostTab>("today");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const clock = parseISO(world.now);
  const today = world.now.slice(0, 10);
  const summary = hostToday(world, today);
  const grantedIds = new Set(
    grants
      .filter((grant) => grant.status === "active" && grant.role === "HOST" && grant.scopeRef)
      .map((grant) => grant.scopeRef as string)
      .filter((id) => villas.some((villa) => villa.id === id)),
  );
  const mine = [
    ...villasForHost(hostId),
    ...villas.filter((villa) => grantedIds.has(villa.id)),
  ].filter((villa, index, list) => list.findIndex((item) => item.id === villa.id) === index);
  const mineIds = new Set(mine.map((villa) => villa.id));
  const hostRole = { persona: "HOST" as const, hostId, villaIds: [...grantedIds] };
  const todayPending = summary.pending.filter((item) => mineIds.has(item.villaId));
  const todayArriving = summary.arriving.filter((item) => mineIds.has(item.villaId));
  const todayDeparting = summary.departing.filter((item) => mineIds.has(item.villaId));

  const pending = world.requests.filter(
    (item) => item.status === "PENDING" && mineIds.has(item.villaId),
  );
  const holding = world.requests.filter(
    (item) =>
      item.status === "ACCEPTED" &&
      mineIds.has(item.villaId) &&
      !world.bookings.some((booking) => booking.requestId === item.id && booking.status === "CONFIRMED"),
  );
  const bookedRequests = world.requests.filter(
    (item) =>
      mineIds.has(item.villaId) &&
      world.bookings.some((booking) => booking.requestId === item.id && booking.status === "CONFIRMED"),
  );
  const myStays = world.stays.filter((stay) => mineIds.has(stay.villaId));
  const myIncidents = world.incidents.filter((item) => mineIds.has(item.villaId));
  const myHolds = (world.protectiveHolds ?? []).filter(
    (item) => item.status === "ACTIVE" && mineIds.has(item.villaId),
  );
  const openReports = (world.externalReports ?? []).filter(
    (item) => !item.factId && mineIds.has(item.villaId),
  );
  const factsWaiting = (world.externalAccommodations ?? []).filter(
    (item) => !item.commitmentId && mineIds.has(item.villaId),
  );

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(domainMessageVi(err));
    }
  }

  return (
    <RoleGate allow={["HOST"]}>
    <main lang="vi" className="pb-20">
      <div className="border-b border-border bg-cream">
        <div className="mx-auto max-w-lg px-4 pt-6 pb-4 sm:px-6">
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Host · Oceanami</p>
          <h1 className="mt-1 font-serif text-title">Lịch, yêu cầu, đặt chỗ.</h1>
          <p className="mt-2 text-sm text-muted">
            Chỉ Host chấp nhận. Thanh toán do Stayora vận hành ghi nhận.
          </p>
          {error ? <p className="mt-3 text-sm text-lotus-deep">{error}</p> : null}
        </div>
        <div className="sticky top-16 z-20 border-t border-border bg-cream/95 backdrop-blur-md">
          <div className="mx-auto grid max-w-lg grid-cols-4 px-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`h-12 px-1 text-xs font-medium sm:text-sm ${
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

      {tab === "today" ? (
        <section className="mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6">
          <TodayCard
            title="Yêu cầu chờ phản hồi"
            count={todayPending.length}
            onClick={() => setTab("requests")}
          >
            {todayPending.map((request) => (
              <p key={request.id} className="text-sm">
                {getVilla(request.villaId)?.name} ·{" "}
                {visibleGuestName(
                  { guestName: request.guestName, villaId: request.villaId, saleId: request.saleId },
                  hostRole,
                )}
              </p>
            ))}
          </TodayCard>
          <TodayCard title="Khách đến hôm nay" count={todayArriving.length} onClick={() => setTab("stays")}>
            {todayArriving.map((stay) => (
              <p key={stay.id} className="text-sm">
                {getVilla(stay.villaId)?.name} · {visibleGuestName(stay, hostRole)} · {stay.originLabel}
              </p>
            ))}
          </TodayCard>
          <TodayCard title="Khách đi hôm nay" count={todayDeparting.length} onClick={() => setTab("stays")}>
            {todayDeparting.map((stay) => (
              <p key={stay.id} className="text-sm">
                {getVilla(stay.villaId)?.name} · {visibleGuestName(stay, hostRole)}
              </p>
            ))}
          </TodayCard>
          <TodayCard title="Cần chú ý" count={myIncidents.length + myHolds.length}>
            {myIncidents.map((incident) => (
              <p key={incident.id} className="text-sm">
                {getVilla(incident.villaId)?.name} · {incident.note}
              </p>
            ))}
            {myHolds.map((hold) => (
              <p key={hold.id} className="text-sm">
                {getVilla(hold.villaId)?.name} · Giữ bảo vệ
                {hold.reviewDueAt <= world.now ? " · quá hạn xem lại" : ""}
              </p>
            ))}
          </TodayCard>
          {openReports.map((report) => (
            <article key={report.id} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs font-semibold tracking-wider text-muted uppercase">Tin báo</p>
              <p className="mt-1 font-medium">{getVilla(report.villaId)?.name}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {viDateRange(report.checkIn, report.checkOut)} · {report.source}
              </p>
              <p className="mt-2 text-sm text-muted">Chưa ghi nhận. Lịch không đổi.</p>
              <Button
                className="mt-3 w-full"
                onClick={() =>
                  run(() =>
                    hostRecordFact({
                      villaId: report.villaId,
                      checkIn: report.checkIn,
                      checkOut: report.checkOut,
                      guests: report.guests,
                      source: report.source,
                      guestName: report.guestName,
                      reportId: report.id,
                    }),
                  )
                }
              >
                Ghi nhận tin này
              </Button>
            </article>
          ))}
          {factsWaiting.map((fact) => (
            <article key={fact.id} className="rounded-2xl border border-moss bg-paper p-4">
              <p className="text-xs font-semibold tracking-wider text-moss uppercase">Đã ghi nhận</p>
              <p className="mt-1 font-medium">{getVilla(fact.villaId)?.name}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {viDateRange(fact.checkIn, fact.checkOut)} · {fact.source}
              </p>
              <p className="mt-2 text-sm text-muted">Chưa giữ chỗ. Lịch vẫn trống.</p>
              <Button className="mt-3 w-full" onClick={() => run(() => hostEstablishExternal(fact.id))}>
                Giữ chỗ theo ghi nhận này
              </Button>
            </article>
          ))}
          <TodayCard
            title="Xung đột lịch đang mở"
            count={summary.openConflicts.filter((item) => mineIds.has(item.villaId)).length}
            onClick={() => setTab("calendar")}
          >
            {summary.openConflicts
              .filter((item) => mineIds.has(item.villaId))
              .map((conflict) => (
              <p key={conflict.id} className="text-sm">
                {getVilla(conflict.villaId)?.name} · Stayora vận hành sẽ xử lý
              </p>
            ))}
          </TodayCard>
          <TodayCard title="Khoản còn lại sắp đến hạn" count={summary.balancesDue.length}>
            {summary.balancesDue.map((obligation) => {
              const request = world.requests.find((item) => item.id === obligation.requestId);
              return (
                <p key={obligation.id} className="text-sm">
                  {request ? getVilla(request.villaId)?.name : obligation.requestId} ·{" "}
                  {balanceLine(obligation, false)}
                </p>
              );
            })}
          </TodayCard>
          {myHolds.length > 0 ? (
            <div className="space-y-3">
              {myHolds.map((hold) => (
                <article key={hold.id} className="rounded-2xl border-2 border-[#8a5a12] bg-[#f8edd6] p-4">
                  <p className="font-medium text-[#6a4310]">
                    {getVilla(hold.villaId)?.name} · Giữ bảo vệ
                  </p>
                  <p className="mt-1 text-sm text-[#6a4310]">{hold.note}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => run(() => releaseProtectiveHold(hold.id))}>
                      Gỡ giữ
                    </Button>
                    <Button variant="ink" onClick={() => run(() => recordMaintenanceFromHold(hold.id))}>
                      Ghi bảo trì
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          <label className="block text-sm">
            Ghi chú khi báo việc
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
            />
          </label>
        </section>
      ) : null}

      {tab === "calendar" ? (
        <section className="pt-4">
          <HostCalendar
            world={world}
            villas={mine}
            onExternal={(input) => run(() => hostExternal(input))}
            onRecordFact={(input) => run(() => hostRecordFact(input))}
            onBlock={(input) => run(() => hostCreateBlock(input))}
            onRelease={(id) => run(() => hostReleaseBlock(id))}
            onPlaceHold={(input) => run(() => placeProtectiveHold(input))}
            onReleaseHold={(id) => run(() => releaseProtectiveHold(id))}
          />
        </section>
      ) : null}

      {tab === "requests" ? (
        <div className="mx-auto max-w-lg px-4 sm:px-6">
          <Section title="Chờ chấp nhận" count={pending.length} empty="Không có yêu cầu mới.">
            {pending.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                clock={clock}
                worldLines={[]}
                action={
                  <Button className="w-full" onClick={() => run(() => hostAccept(request.id))}>
                    Chấp nhận · giữ 30 phút
                  </Button>
                }
              />
            ))}
          </Section>
          <Section title="Đang giữ chỗ" count={holding.length} empty="Không có chỗ đang giữ.">
            {holding.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                clock={clock}
                worldLines={hostPaymentStatus(world, request.id)}
              />
            ))}
          </Section>
          <Section title="Đã xác nhận" count={bookedRequests.length} empty="Chưa có booking.">
            {bookedRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                clock={clock}
                booked
                worldLines={[
                  `Mã ${world.bookings.find((item) => item.requestId === request.id)?.reference ?? ""}`,
                  ...hostPaymentStatus(world, request.id),
                ]}
              />
            ))}
          </Section>
        </div>
      ) : null}

      {tab === "stays" ? (
        <section className="mx-auto max-w-lg space-y-3 px-4 pt-5 sm:px-6">
          {myStays.length === 0 ? (
            <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              Chưa có lưu trú.
            </p>
          ) : (
            myStays.map((stay) => {
              const booking = world.bookings.find((item) => item.stayId === stay.id);
              return (
                <article
                  key={stay.id}
                  className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{getVilla(stay.villaId)?.name ?? stay.villaId}</p>
                      <p className="mt-1 text-sm text-ink-soft">{visibleGuestName(stay, hostRole)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep">
                      {stayGuestLabel(stay.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {viDateRange(stay.checkIn, stay.checkOut)} · {stay.guests} khách
                  </p>
                  <p className="mt-1 text-sm text-muted">{stay.originLabel}</p>
                  {booking ? (
                    <p className="mt-2 text-sm text-muted">
                      Mã <span className="font-medium text-ink">{booking.reference}</span>
                      {booking.status === "CANCELLED" ? " · đã huỷ" : ""}
                    </p>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        run(() => reportIncident(stay.id, note.trim() || "Cần xem villa", false))
                      }
                    >
                      Báo việc
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        run(() =>
                          placeProtectiveHold({
                            villaId: stay.villaId,
                            start: stay.checkIn,
                            end: stay.checkOut,
                            note: note.trim() || "Cần xem villa",
                          }),
                        )
                      }
                    >
                      Giữ bảo vệ
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      ) : null}
    </main>
    </RoleGate>
  );
}

function TodayCard({
  title,
  count,
  children,
  onClick,
}: {
  title: string;
  count: number;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-2xl bg-paper p-4 text-left shadow-[var(--shadow-border)]"
    >
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{title}</p>
        <p className="font-serif text-2xl tabular-nums">{count}</p>
      </div>
      <div className="mt-3 space-y-1 text-ink-soft">
        {count === 0 ? <p className="text-sm text-muted">Không có.</p> : children}
      </div>
    </button>
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
    <section className="pt-6">
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
  worldLines,
  booked,
}: {
  request: StayRequest;
  clock: Date;
  action?: ReactNode;
  worldLines: string[];
  booked?: boolean;
}) {
  const villa = getVilla(request.villaId);
  const sales = useBookingStore((state) => state.world.sales);
  const hostId = useBookingStore((state) => state.hostId);
  const sale = request.saleId ? sales.find((person) => person.id === request.saleId) : undefined;
  const source = request.source === "SALE" ? `Sale · ${sale?.name ?? "Sale"}` : "Khách trực tiếp";
  const plan = paymentPlanLabel(request.total, request.checkIn, request.createdAt);
  const guestLabel = visibleGuestName(
    { guestName: request.guestName, villaId: request.villaId, saleId: request.saleId },
    { persona: "HOST", hostId },
  );

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{villa?.name ?? request.villaId}</p>
          <p className="mt-1 text-sm text-ink-soft">{guestLabel}</p>
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
      {worldLines.map((line) => (
        <p key={line} className="mt-2 text-sm text-ink-soft">
          {line}
        </p>
      ))}
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );
}

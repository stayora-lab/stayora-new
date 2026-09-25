import type { ReactNode } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { DestinationAbout, StayoraServiceNote } from "@/components/site-chrome";
import { StaySummary } from "@/components/stay-summary";
import { Photo, VillaPlaceholder } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { balanceLine, obligationSucceeded, stayGuestLabel } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { GUEST_ARRIVAL, LOCATION_LABEL } from "@/lib/destination";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/your-stay/$stayId")({
  component: YourStayPage,
});

function formatViDate(iso: string): string {
  return format(parseISO(iso), "EEEE d/M/yyyy", { locale: vi });
}

function YourStayPage() {
  const { stayId } = Route.useParams();
  const hydrated = useBookingStore((state) => state.hydrated);
  const world = useBookingStore((state) => state.world);
  const stay = world.stays.find((item) => item.id === stayId);
  const booking = world.bookings.find((item) => item.stayId === stayId);
  const request = booking
    ? world.requests.find((item) => item.id === booking.requestId)
    : undefined;
  const balance = request
    ? world.obligations.find((item) => item.requestId === request.id && item.kind === "BALANCE")
    : undefined;
  const balancePaid = balance ? obligationSucceeded(world, balance.id) : false;

  if (!hydrated) {
    return <main className="mx-auto max-w-3xl px-4 py-24 text-muted">Đang mở kỳ nghỉ…</main>;
  }

  if (!stay && request) {
    return <Navigate to="/requests/$requestId" params={{ requestId: request.id }} />;
  }

  if (!stay) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Không tìm thấy kỳ nghỉ này</h1>
        <Button asChild className="mt-8">
          <Link to="/">Xem villa Oceanami</Link>
        </Button>
      </main>
    );
  }

  const villa = getVilla(stay.villaId);
  if (!villa) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Villa này không còn được niêm yết</h1>
        <Button asChild className="mt-8">
          <Link to="/">Xem villa Oceanami</Link>
        </Button>
      </main>
    );
  }

  const hero = villa.images[0];
  const summary = request ?? {
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: stay.guests,
    nights: booking?.nights ?? 0,
    total: booking?.total ?? 0,
  };

  return (
    <main lang="vi" className="pb-16">
      <div className="relative h-72 overflow-hidden sm:h-96">
        {hero ? <Photo src={hero.src} alt={hero.alt} /> : <VillaPlaceholder name={villa.name} />}
        <div className="absolute inset-0 bg-linear-to-t from-ink/65 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <p className="text-xs font-semibold tracking-wider text-cream/80 uppercase">
            Kỳ nghỉ của bạn
          </p>
          <h1 className="mt-2 font-serif text-title text-cream">{villa.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="-mt-8">
          <StaySummary villa={villa} request={summary} totalLabel="Tổng kỳ nghỉ" />
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-lotus-soft px-3 py-1 font-medium text-lotus-deep">
            {stayGuestLabel(stay.status)}
          </span>
        </p>
        <StayoraServiceNote
          reference={booking?.reference}
          payment={balance ? balanceLine(balance, balancePaid) : undefined}
        />

        {booking?.status === "CANCELLED" && stay.status === "SCHEDULED" ? (
          <p className="mt-4 rounded-2xl bg-cream-deep px-4 py-3 text-sm text-ink">
            Đặt chỗ Stayora đã huỷ. Kỳ ở vẫn là sắp đến, cho đến khi được ghi là không diễn ra.
          </p>
        ) : null}
        {stay.status === "DID_NOT_OCCUR" ? (
          <p className="mt-4 rounded-2xl bg-[#fdecea] px-4 py-3 text-sm text-[#7a1f16]">
            Kỳ ở này không diễn ra.
          </p>
        ) : null}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <StayCard title="Nhận phòng">
            <p>{formatViDate(stay.checkIn)}</p>
            <p className="mt-2 text-sm text-muted">
              {stay.guests} khách.
            </p>
            <p className="mt-2 text-sm text-muted">{GUEST_ARRIVAL}</p>
          </StayCard>
          <StayCard title="Trả phòng">
            <p>{formatViDate(stay.checkOut)}</p>
            <p className="mt-2 text-sm text-muted">
              Chi tiết trả phòng sẽ được gửi cùng hướng dẫn nhận phòng.
            </p>
          </StayCard>
          <StayCard title="Villa">
            <p>
              {villa.bedrooms} phòng ngủ · ngủ {villa.sleeps} · hồ bơi riêng
            </p>
            <p className="mt-2 text-sm text-muted">{villa.summary}</p>
            <Link
              to="/villas/$villaId"
              params={{ villaId: villa.id }}
              className="mt-4 inline-block text-sm font-medium text-lotus hover:text-lotus-deep"
            >
              Xem villa
            </Link>
          </StayCard>
          <StayCard title="Đến nơi">
            <p>{LOCATION_LABEL}</p>
            <p className="mt-2 text-sm text-muted">{GUEST_ARRIVAL}</p>
          </StayCard>
        </div>

        <section className="mt-6 rounded-2xl bg-cream-deep/70 p-6 sm:p-8">
          <p className="max-w-2xl text-ink-soft">
            {GUEST_ARRIVAL}
          </p>
        </section>
        <DestinationAbout />
      </div>
    </main>
  );
}

function StayCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-paper p-6 shadow-[var(--shadow-border)]">
      <h2 className="font-medium">{title}</h2>
      <div className="mt-3 text-ink-soft">{children}</div>
    </section>
  );
}

import type { ReactNode } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { StaySummary } from "@/components/stay-summary";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { stayGuestLabel } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";
import { formatLongDate, guestLabel } from "@/lib/stay";
import { DESTINATION, getVilla } from "@/lib/villas";

export const Route = createFileRoute("/your-stay/$stayId")({
  component: YourStayPage,
});

function YourStayPage() {
  const { stayId } = Route.useParams();
  const hydrated = useBookingStore((state) => state.hydrated);
  const world = useBookingStore((state) => state.world);
  const stay = world.stays.find((item) => item.id === stayId);
  const request = world.requests.find((item) => item.stayId === stayId);
  const booking = world.bookings.find((item) => item.stayId === stayId);

  if (!hydrated) {
    return <main className="mx-auto max-w-3xl px-4 py-24 text-muted">Opening your stay…</main>;
  }

  if (!stay && request && request.status !== "CONFIRMED") {
    return <Navigate to="/requests/$requestId" params={{ requestId: request.id }} />;
  }

  if (!stay) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">We can't find that stay</h1>
        <Button asChild className="mt-8">
          <Link to="/">Browse Oceanami</Link>
        </Button>
      </main>
    );
  }

  const villa = getVilla(stay.villaId);
  if (!villa) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">This stay is no longer listed</h1>
        <Button asChild className="mt-8">
          <Link to="/">Browse Oceanami</Link>
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
    <main className="pb-16">
      <div className="relative h-72 overflow-hidden sm:h-96">
        {hero ? <Photo src={hero.src} alt={hero.alt} /> : null}
        <div className="absolute inset-0 bg-linear-to-t from-ink/65 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-8 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.16em] text-cream/80 uppercase">
            Your stay · Oceanami
          </p>
          <h1 className="mt-2 font-serif text-title text-cream">{villa.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="-mt-8">
          <StaySummary villa={villa} request={summary} />
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-lotus-soft px-3 py-1 font-medium text-lotus-deep">
            {stayGuestLabel(stay.status)}
          </span>
          {booking?.reference ? (
            <span className="text-muted">
              Confirmation <span className="font-medium text-ink">{booking.reference}</span>
            </span>
          ) : null}
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <StayCard title="Arrival">
            <p>{formatLongDate(stay.checkIn)}</p>
            <p className="mt-2 text-sm text-muted">
              Arrival notes will be shared before the stay. {guestLabel(stay.guests)} are
              expected.
            </p>
          </StayCard>
          <StayCard title="Departure">
            <p>{formatLongDate(stay.checkOut)}</p>
            <p className="mt-2 text-sm text-muted">
              Departure details will be shared with your arrival notes.
            </p>
          </StayCard>
          <StayCard title="The villa">
            <p>
              {villa.bedrooms} bedrooms · {guestLabel(villa.sleeps)} · private pool
            </p>
            <p className="mt-2 text-sm text-muted">{villa.summary}</p>
            <Link
              to="/villas/$villaId"
              params={{ villaId: villa.id }}
              className="mt-4 inline-block text-sm font-medium text-lotus hover:text-lotus-deep"
            >
              View the villa
            </Link>
          </StayCard>
          <StayCard title="Getting here">
            <p>{DESTINATION.address}</p>
            <p className="mt-2 text-sm text-muted">{DESTINATION.travel}.</p>
          </StayCard>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)] md:grid md:grid-cols-2">
          <div className="h-52 md:h-auto">
            <Photo src="/images/beach-club.jpg" alt="Oceanami beach club" />
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
              While you're here
            </p>
            <h2 className="mt-2 font-serif text-2xl">Beach club, spa, and the house kitchen</h2>
            <p className="mt-3 text-ink-soft">
              Your stay includes the villa and access to the Oceanami beach club. A fuller guide
              will sit here before arrival — this is the doorway into it.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-cream-deep/70 p-6 sm:p-8">
          <h2 className="font-medium">Need a hand</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            The Stayora team will be in touch before you arrive. For around the grounds,
            the destination team at Oceanami looks after guests on site.
          </p>
        </section>
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

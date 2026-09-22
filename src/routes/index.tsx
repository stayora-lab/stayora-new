import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DateRangeField, FieldSplit, GuestField } from "@/components/dates-guests";
import { OceanamiEmblem } from "@/components/mark";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { VillaCard } from "@/components/villa-card";
import { useBookingStore } from "@/lib/store";
import {
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  DEFAULT_GUESTS,
  parseStaySearch,
} from "@/lib/stay";
import { DESTINATION, villas, type VillaSetting } from "@/lib/villas";

export const Route = createFileRoute("/")({
  validateSearch: parseStaySearch,
  component: MarketplacePage,
});

type FilterId = "all" | VillaSetting | "family";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All stays" },
  { id: "beachfront", label: "By the sea" },
  { id: "garden", label: "Garden" },
  { id: "hillside", label: "Hillside" },
  { id: "family", label: "Sleeps 6+" },
];

function MarketplacePage() {
  const search = Route.useSearch();
  const stored = useBookingStore((state) => state.search);
  const setSearch = useBookingStore((state) => state.setSearch);
  const navigate = useNavigate({ from: "/" });
  const [filter, setFilter] = useState<FilterId>("all");

  const checkIn = search.checkIn ?? stored.checkIn ?? DEFAULT_CHECK_IN;
  const checkOut = search.checkOut ?? stored.checkOut ?? DEFAULT_CHECK_OUT;
  const guests = search.guests ?? stored.guests ?? DEFAULT_GUESTS;

  function update(next: { checkIn?: string; checkOut?: string; guests?: number }) {
    const merged = { checkIn, checkOut, guests, ...next };
    setSearch(merged);
    void navigate({ search: merged, replace: true });
  }

  const visible = useMemo(() => {
    return villas.filter((villa) => {
      if (filter === "family") return villa.sleeps >= 6;
      if (filter === "all") return true;
      return villa.setting === filter;
    });
  }, [filter]);

  return (
    <main>
      <section className="relative">
        <div className="relative h-[72vh] min-h-100 overflow-hidden">
          <Photo
            src="/images/oceanami-hero.jpg"
            alt="Ảnh minh hoạ"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/20 to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-28">
            <OceanamiEmblem className="mb-5 h-14 w-14" />
            <p className="text-sm font-medium tracking-[0.18em] text-cream/80 uppercase">
              Điểm đến · {DESTINATION.region}
            </p>
            <h1 className="mt-3 font-serif text-display text-cream italic">Oceanami</h1>
            <p className="mt-4 max-w-xl text-lead text-cream/90">
              Private villas between the East Sea and Minh Đạm mountain.
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-4 sm:-mt-12 sm:px-6">
          <form
            className="flex flex-col gap-2 rounded-2xl bg-paper p-2 shadow-[var(--shadow-lift)] md:flex-row md:items-center md:rounded-full md:p-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <FieldSplit>
              <DateRangeField
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(next) => update(next)}
              />
              <GuestField guests={guests} onChange={(value) => update({ guests: value })} />
            </FieldSplit>
            <Button type="submit" size="lg" className="md:mr-1 md:px-8">
              Show stays
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
              The destination
            </p>
            <h2 className="mt-3 font-serif text-title">A beach, a mountain, and a handful of houses.</h2>
          </div>
          <p className="text-lead text-ink-soft">{DESTINATION.intro}</p>
        </div>
        <dl className="mt-10 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold tracking-wider text-muted uppercase">From the city</dt>
            <dd className="mt-2 text-ink-soft">{DESTINATION.travel}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-muted uppercase">The shore</dt>
            <dd className="mt-2 text-ink-soft">Phước Hải beach, on the East Sea.</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold tracking-wider text-muted uppercase">Behind the villas</dt>
            <dd className="mt-2 text-ink-soft">Minh Đạm mountain and tropical garden.</dd>
          </div>
        </dl>
      </section>

      <section className="mx-auto grid max-w-6xl items-stretch gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl">
          <div className="relative h-72 lg:h-full">
            <Photo src="/images/beach-club.jpg" alt="Ảnh minh hoạ" />
            <span className="absolute right-3 bottom-3 rounded-full bg-paper/92 px-2.5 py-1 text-[11px] text-muted">
              Ảnh minh hoạ
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-2xl bg-paper p-8 shadow-[var(--shadow-border)] sm:p-10">
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Life at Oceanami</p>
          <h2 className="mt-3 font-serif text-title">A beach club, a spa, and your own kitchen.</h2>
          <p className="mt-4 text-ink-soft">
            Days here are unscheduled on purpose. Swim from the villa, walk to the club, cook if you
            want the house to yourselves. Chủ nhà sẽ xem và phản hồi.
          </p>
        </div>
      </section>

      <section id="stays" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Places to stay</p>
            <h2 className="mt-2 font-serif text-title">Villas at Oceanami</h2>
          </div>
          <p className="text-sm text-muted">{visible.length} homes</p>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                filter === item.id
                  ? "bg-ink text-cream"
                  : "bg-paper text-ink shadow-[var(--shadow-border)] hover:bg-cream-deep"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((villa) => (
            <VillaCard
              key={villa.id}
              villa={villa}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

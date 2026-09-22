import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DateRangeField, FieldSplit, GuestField } from "@/components/dates-guests";
import { OceanamiLockup } from "@/components/mark";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import { VillaCard } from "@/components/villa-card";
import {
  AERIAL_PHOTO,
  BLOSSOM_PHOTO,
  DESTINATION_COPY,
  HERO_PHOTO,
  LANDSCAPE_PHOTO,
  LOCATION_LABEL,
  MOUNTAIN_PHOTO,
  POOL_PHOTO,
} from "@/lib/destination";
import { useBookingStore } from "@/lib/store";
import {
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  DEFAULT_GUESTS,
  parseStaySearch,
} from "@/lib/stay";
import { type VillaSetting, villas } from "@/lib/villas";

export const Route = createFileRoute("/")({
  validateSearch: parseStaySearch,
  component: MarketplacePage,
});

type FilterId = "all" | VillaSetting | "family";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "beachfront", label: "Ven biển" },
  { id: "garden", label: "Vườn" },
  { id: "hillside", label: "Sườn núi" },
  { id: "family", label: "Ngủ 6+" },
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
    <main lang="vi">
      <section className="relative">
        <div className="relative h-[72vh] min-h-100 overflow-hidden">
          <Photo src={HERO_PHOTO.src} alt={HERO_PHOTO.alt} />
          <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/20 to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-24 sm:px-6 sm:pb-28">
            <p className="text-xs font-semibold tracking-wider text-cream/80 uppercase">Điểm đến</p>
            <OceanamiLockup tone="on-photo" className="mt-3 h-12 max-w-full sm:h-16" />
            <p className="mt-4 max-w-xl text-lead text-cream/90">
              Đặt villa của các chủ nhà tại Oceanami qua Stayora.
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
              Xem villa
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold tracking-wider text-lotus uppercase">{LOCATION_LABEL}</p>
        <h2 className="mt-3 font-serif text-title">{DESTINATION_COPY.namePlace.title}</h2>
        <p className="mt-4 max-w-3xl text-lead text-ink-soft">{DESTINATION_COPY.namePlace.body}</p>
      </section>

      <section className="mx-auto grid max-w-6xl items-stretch gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl">
          <div className="relative h-72 lg:h-full min-h-72">
            <Photo src={AERIAL_PHOTO.src} alt={AERIAL_PHOTO.alt} />
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-2xl bg-paper p-8 shadow-[var(--shadow-border)] sm:p-10">
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
            {DESTINATION_COPY.about.title}
          </p>
          <p className="mt-4 text-ink-soft">{DESTINATION_COPY.about.body}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-serif text-title">{DESTINATION_COPY.amenities.title}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {DESTINATION_COPY.amenities.items.map((item) => (
            <li
              key={item}
              className="rounded-xl bg-paper px-4 py-3 text-sm text-ink-soft shadow-[var(--shadow-border)]"
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="relative h-44 overflow-hidden rounded-2xl">
            <Photo src={POOL_PHOTO.src} alt={POOL_PHOTO.alt} />
          </div>
          <div className="relative h-44 overflow-hidden rounded-2xl">
            <Photo src={LANDSCAPE_PHOTO.src} alt={LANDSCAPE_PHOTO.alt} />
          </div>
          <div className="relative h-44 overflow-hidden rounded-2xl">
            <Photo src={BLOSSOM_PHOTO.src} alt={BLOSSOM_PHOTO.alt} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-stretch gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center rounded-2xl bg-paper p-8 shadow-[var(--shadow-border)] sm:p-10">
          <h2 className="font-serif text-title">{DESTINATION_COPY.around.title}</h2>
          <p className="mt-4 text-ink-soft">{DESTINATION_COPY.around.body}</p>
        </div>
        <div className="overflow-hidden rounded-2xl">
          <div className="relative h-72 lg:h-full min-h-72">
            <Photo src={MOUNTAIN_PHOTO.src} alt={MOUNTAIN_PHOTO.alt} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-serif text-title">{DESTINATION_COPY.arrival.title}</h2>
        <p className="mt-4 max-w-3xl text-ink-soft">{DESTINATION_COPY.arrival.body}</p>
      </section>

      <section id="stays" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-lotus uppercase">{LOCATION_LABEL}</p>
            <h2 className="mt-2 font-serif text-title">Villa của các chủ nhà</h2>
          </div>
          <p className="text-sm text-muted">{visible.length} villa</p>
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

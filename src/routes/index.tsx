import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DestinationAmenities } from "@/components/destination-amenities";
import { HeroSlider } from "@/components/hero-slider";
import { Photo } from "@/components/photo";
import { VillaCard } from "@/components/villa-card";
import {
  ABOUT_BODY,
  ABOUT_TITLE,
  AROUND_BODY,
  AROUND_TITLE,
  ARRIVAL_BODY,
  ARRIVAL_TITLE,
  LOCATION_LABEL,
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
      <HeroSlider checkIn={checkIn} checkOut={checkOut} guests={guests} onChange={update} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold tracking-wider text-lotus uppercase">{LOCATION_LABEL}</p>
        <h2 className="mt-3 font-serif text-title">{ABOUT_TITLE}</h2>
        <p className="mt-4 max-w-3xl text-lead text-ink-soft">{ABOUT_BODY}</p>
      </section>

      <DestinationAmenities />

      <section className="mx-auto grid max-w-6xl items-stretch gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center rounded-2xl bg-paper p-8 shadow-[var(--shadow-border)] sm:p-10">
          <h2 className="font-serif text-title">{AROUND_TITLE}</h2>
          <p className="mt-4 text-ink-soft">{AROUND_BODY}</p>
        </div>
        <div className="overflow-hidden rounded-2xl">
          <div className="relative h-72 min-h-72 lg:h-full">
            <Photo
              src="/photos/destination/minh-dam.jpg"
              alt="Núi Minh Đạm phía sau Oceanami, Phước Hải"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-serif text-title">{ARRIVAL_TITLE}</h2>
        <p className="mt-4 max-w-3xl text-ink-soft">{ARRIVAL_BODY}</p>
      </section>

      <section id="stays" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24 sm:px-6">
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

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bath,
  ChefHat,
  Laptop,
  ParkingCircle,
  Shirt,
  ShowerHead,
  Sparkles,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";
import { BookingPanel, MobileBookingBar } from "@/components/booking-panel";
import { VillaGallery } from "@/components/gallery";
import { Photo } from "@/components/photo";
import { Button } from "@/components/ui/button";
import {
  ABOUT_BODY,
  ABOUT_TITLE,
  AMENITIES_SECTION_ID,
  AROUND_BODY,
  AROUND_TITLE,
  ARRIVAL_BODY,
  ARRIVAL_TITLE,
  LOCATION_LABEL,
  VILLA_COMMON_AMENITIES_LINE,
} from "@/lib/destination";
import { useBookingStore } from "@/lib/store";
import {
  bedroomLabel,
  DEFAULT_CHECK_IN,
  DEFAULT_CHECK_OUT,
  DEFAULT_GUESTS,
  guestLabel,
  parseStaySearch,
} from "@/lib/stay";
import {
  AMENITY_LABELS,
  getVilla,
  type AmenityId,
  type Villa,
} from "@/lib/villas";

export const Route = createFileRoute("/villas/$villaId")({
  validateSearch: parseStaySearch,
  component: VillaPage,
});

const AMENITY_ICONS: Record<AmenityId, typeof Wifi> = {
  pool: Waves,
  wifi: Wifi,
  kitchen: ChefHat,
  air: Wind,
  parking: ParkingCircle,
  bbq: UtensilsCrossed,
  washer: Shirt,
  shower: ShowerHead,
  housekeeping: Sparkles,
  workspace: Laptop,
  baths: Bath,
};

function VillaPage() {
  const { villaId } = Route.useParams();
  const villa = getVilla(villaId);

  if (!villa) {
    return (
      <main lang="vi" className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif text-title">Villa này không còn được niêm yết</h1>
        <p className="mt-3 text-ink-soft">Có thể villa đã được chuyển, hoặc link chưa đủ.</p>
        <Button asChild className="mt-8">
          <Link to="/">Xem villa Oceanami</Link>
        </Button>
      </main>
    );
  }

  return <VillaDetail villa={villa} />;
}

function VillaDetail({ villa }: { villa: Villa }) {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const stored = useBookingStore((state) => state.search);
  const setSearch = useBookingStore((state) => state.setSearch);
  const guestCreateRequest = useBookingStore((state) => state.guestCreateRequest);
  const world = useBookingStore((state) => state.world);
  const requests = world.requests;

  const checkIn = search.checkIn ?? stored.checkIn ?? DEFAULT_CHECK_IN;
  const checkOut = search.checkOut ?? stored.checkOut ?? DEFAULT_CHECK_OUT;
  const guests = search.guests ?? stored.guests ?? DEFAULT_GUESTS;

  function update(next: { checkIn?: string; checkOut?: string; guests?: number }) {
    const merged = { checkIn, checkOut, guests, ...next };
    setSearch(merged);
    void navigate({
      to: "/villas/$villaId",
      params: { villaId: villa.id },
      search: merged,
      replace: true,
    });
  }

  const existing = requests.find(
    (request) =>
      request.villaId === villa.id &&
      request.checkIn === checkIn &&
      request.checkOut === checkOut,
  );
  const existingBooking = existing
    ? world.bookings.find((item) => item.requestId === existing.id)
    : undefined;

  async function requestStay() {
    const { requestId } = await guestCreateRequest({
      villaId: villa.id,
      checkIn,
      checkOut,
      guests,
    });
    void navigate({ to: "/requests/$requestId", params: { requestId } });
  }

  const booking = {
    villa,
    checkIn,
    checkOut,
    guests,
    onDates: (next: { checkIn: string; checkOut: string }) => update(next),
    onGuests: (value: number) => update({ guests: value }),
    onRequest: requestStay,
    existing: existing
      ? {
          label: existingBooking ? "Mở kỳ nghỉ" : "Xem yêu cầu",
          onOpen: () => {
            if (existingBooking) {
              void navigate({
                to: "/your-stay/$stayId",
                params: { stayId: existingBooking.stayId },
              });
            } else {
              void navigate({
                to: "/requests/$requestId",
                params: { requestId: existing.id },
              });
            }
          },
        }
      : undefined,
  };

  return (
    <main lang="vi" className="pb-28 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
        <VillaGallery images={villa.images} name={villa.name} />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_22rem] lg:items-start lg:py-12">
        <article className="space-y-10">
          <header>
            <p className="text-xs font-semibold tracking-wider text-muted uppercase">
              {LOCATION_LABEL}
            </p>
            <h1 className="mt-2 font-serif text-title">{villa.name}</h1>
            <p className="mt-3 max-w-2xl text-lead text-ink-soft">{villa.tagline}</p>
            <p className="mt-4 text-sm text-ink-soft">
              {bedroomLabel(villa.bedrooms)} · {villa.bathrooms} phòng tắm · {guestLabel(villa.sleeps)} · {villa.sqm} m²
            </p>
          </header>

          <div className="space-y-4 text-ink-soft">
            {villa.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p>
              <Link
                to="/"
                hash={AMENITIES_SECTION_ID}
                className="font-medium text-lotus hover:text-lotus-deep"
              >
                {VILLA_COMMON_AMENITIES_LINE}
              </Link>
            </p>
          </div>

          <section>
            <h2 className="font-medium">Phòng ngủ</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {villa.sleeping.map((room) => (
                <li key={room.title} className="rounded-xl bg-paper p-4 shadow-[var(--shadow-border)]">
                  <p className="font-medium">{room.title}</p>
                  <p className="mt-1 text-sm text-muted">{room.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-medium">Trong villa</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {villa.amenities.map((id) => {
                const Icon = AMENITY_ICONS[id];
                return (
                  <li key={id} className="flex items-center gap-3 text-sm">
                    <Icon className="size-4 text-ink-soft" />
                    {AMENITY_LABELS[id]}
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h2 className="font-medium">{ABOUT_TITLE}</h2>
            <p className="mt-3 text-ink-soft">{ABOUT_BODY}</p>
          </section>

          <section>
            <h2 className="font-medium">{AROUND_TITLE}</h2>
            <p className="mt-3 text-ink-soft">{AROUND_BODY}</p>
          </section>

          <section className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-medium">{ARRIVAL_TITLE}</h2>
              <p className="mt-3 text-ink-soft">{ARRIVAL_BODY}</p>
              <p className="mt-3 text-sm text-muted">{LOCATION_LABEL}</p>
            </div>
            <div className="relative h-52 overflow-hidden rounded-xl">
              <Photo
                src="/photos/destination/landscape.jpg"
                alt="Cảnh quan trong khu nghỉ dưỡng Oceanami · Phước Hải"
              />
            </div>
          </section>
        </article>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <BookingPanel {...booking} />
        </div>
      </div>

      <MobileBookingBar {...booking} />
    </main>
  );
}

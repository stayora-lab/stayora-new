import { Link } from "@tanstack/react-router";
import { Photo, VillaPlaceholder } from "@/components/photo";
import {
  bookability,
  bookabilityCopy,
  bedroomLabel,
  formatVnd,
  guestLabel,
} from "@/lib/stay";
import { useBookingStore } from "@/lib/store";
import type { Villa } from "@/lib/villas";

export function VillaCard({
  villa,
  checkIn,
  checkOut,
  guests,
}: {
  villa: Villa;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const world = useBookingStore((state) => state.world);
  const result = bookability(villa, checkIn, checkOut, guests, world);
  const hero = villa.images[0];

  return (
    <Link
      to="/villas/$villaId"
      params={{ villaId: villa.id }}
      search={{ checkIn, checkOut, guests }}
      className="group block"
    >
      <article className="overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-200 ease-out hover:shadow-[var(--shadow-border-hover)]">
        <div className="relative aspect-photo overflow-hidden">
          {hero ? (
            <Photo
              src={hero.src}
              alt="Ảnh minh hoạ"
              className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <VillaPlaceholder name={villa.name} />
          )}
          <span className="absolute top-3 left-3 rounded-full bg-paper/92 px-3 py-1 text-xs font-medium">
            {villa.settingLabel}
          </span>
          <span className="absolute right-3 bottom-3 rounded-full bg-paper/92 px-2.5 py-1 text-[11px] text-muted">
            Ảnh minh hoạ
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-medium">{villa.name}</h3>
            <p className="text-sm text-muted">Oceanami · Phước Hải</p>
            <p className="mt-1 text-xs text-muted">Chưa có đánh giá</p>
          </div>
          <p className="text-sm text-ink-soft">
            {bedroomLabel(villa.bedrooms)} · {guestLabel(villa.sleeps)}
          </p>
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold tabular-nums">{formatVnd(villa.nightly)}</span>
              <span className="text-muted"> / night</span>
            </p>
            <p className="text-xs text-muted">{bookabilityCopy(result)}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

import { useEffect, useState } from "react";
import { Photo } from "@/components/photo";
import {
  AMENITIES_FOOTNOTE,
  AMENITIES_FREE_INTRO,
  AMENITIES_FREE_TITLE,
  AMENITIES_PAID_TITLE,
  AMENITIES_SECTION_ID,
  AMENITY_CARDS,
  formatAmenityHours,
  type AmenityPhoto,
} from "@/lib/destination";
import { cn } from "@/lib/utils";

export function DestinationAmenities() {
  const free = AMENITY_CARDS.filter((item) => item.free);
  const paid = AMENITY_CARDS.filter((item) => !item.free);
  return (
    <section id={AMENITIES_SECTION_ID} className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
      <Group title={AMENITIES_FREE_TITLE} intro={AMENITIES_FREE_INTRO} items={free} />
      <div className="mt-12">
        <Group title={AMENITIES_PAID_TITLE} items={paid} />
      </div>
      <p className="mt-6 text-sm text-muted">{AMENITIES_FOOTNOTE}</p>
    </section>
  );
}

function Group({
  title,
  intro,
  items,
}: {
  title: string;
  intro?: string;
  items: typeof AMENITY_CARDS;
}) {
  return (
    <div>
      <h2 className="font-serif text-title">{title}</h2>
      {intro ? <p className="mt-4 max-w-3xl text-ink-soft">{intro}</p> : null}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const hours = formatAmenityHours(item.hours);
          return (
            <li
              key={item.name}
              className="overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]"
            >
              <div className="relative aspect-photo">
                <CardPhoto item={item} />
              </div>
              <div className="p-4">
                <p className="font-medium">{item.name}</p>
                {hours ? <p className="mt-1 text-sm text-muted">{hours}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CardPhoto({ item }: { item: (typeof AMENITY_CARDS)[number] }) {
  if (!item.photos || item.photos.length < 2) {
    return <Photo src={item.src} alt={item.alt} />;
  }
  return <AmenitySlider name={item.name} photos={item.photos} />;
}

function AmenitySlider({ name, photos }: { name: string; photos: AmenityPhoto[] }) {
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const photo = photos[index] ?? photos[0];

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [photos.length, reduced]);

  return (
    <div className="relative size-full" data-amenity-slider={name}>
      <Photo src={photo.src} alt={photo.alt} />
      <div
        className="absolute inset-x-0 bottom-1.5 flex justify-center"
        role="tablist"
        aria-label={`Ảnh ${name}`}
      >
        <div className="flex rounded-full bg-ink/55 px-1">
          {photos.map((shot, slideIndex) => (
            <button
              key={shot.file}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`${name}, ảnh ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className="inline-flex h-9 min-w-7 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full",
                  slideIndex === index ? "w-4 bg-cream" : "w-1.5 bg-cream/55",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

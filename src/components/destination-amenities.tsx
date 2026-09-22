import { Photo } from "@/components/photo";
import {
  AMENITIES_FOOTNOTE,
  AMENITIES_FREE_INTRO,
  AMENITIES_FREE_TITLE,
  AMENITIES_PAID_TITLE,
  AMENITIES_SECTION_ID,
  AMENITY_CARDS,
  formatAmenityHours,
} from "@/lib/destination";

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
                <Photo src={item.src} alt={item.alt} />
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

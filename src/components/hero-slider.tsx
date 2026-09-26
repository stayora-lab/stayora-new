import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OceanamiLockup } from "@/components/mark";
import { Photo } from "@/components/photo";
import { DateRangeField, FieldSplit, GuestField } from "@/components/dates-guests";
import { Button } from "@/components/ui/button";
import {
  HERO_SLIDES,
  HERO_SUBTITLE,
  HERO_TITLE,
} from "@/lib/destination";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6000;
const SWIPE_PX = 48;

export function HeroSlider({
  checkIn,
  checkOut,
  guests,
  onChange,
}: {
  checkIn: string;
  checkOut: string;
  guests: number;
  onChange: (next: { checkIn?: string; checkOut?: string; guests?: number }) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(() => new Set([0]));
  const reduced = usePrefersReducedMotion();
  const labelId = useId();
  const touchStart = useRef<number | null>(null);
  const slide = HERO_SLIDES[index] ?? HERO_SLIDES[0];

  function go(next: number) {
    const count = HERO_SLIDES.length;
    setIndex(((next % count) + count) % count);
  }

  useEffect(() => {
    setLoaded((prev) => {
      const next = new Set(prev);
      next.add(index);
      next.add((index + 1) % HERO_SLIDES.length);
      return next;
    });
  }, [index]);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index, paused, reduced]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.buttons !== 1) return;
    touchStart.current = event.clientX;
    setPaused(true);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (start == null) return;
    const delta = event.clientX - start;
    if (delta <= -SWIPE_PX) go(index + 1);
    else if (delta >= SWIPE_PX) go(index - 1);
    setPaused(false);
  }

  return (
    <section
      className="relative"
      aria-labelledby={labelId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className="relative h-[82vh] min-h-100 overflow-hidden sm:h-[78vh]"
        role="region"
        aria-roledescription="carousel"
        aria-label="Ảnh điểm đến Oceanami"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          touchStart.current = null;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            go(index + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(index - 1);
          }
        }}
      >
        {HERO_SLIDES.map((item, slideIndex) => (
          <div
            key={item.file}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-[var(--ease-out)]",
              slideIndex === index ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={slideIndex !== index}
          >
            {loaded.has(slideIndex) ? (
              <Photo
                src={item.src}
                alt={item.alt}
                eager={slideIndex === 0}
                className="size-full"
              />
            ) : null}
          </div>
        ))}
        <div className="absolute inset-0 bg-linear-to-b from-ink/45 via-ink/15 to-ink/75" />

        <div className="absolute inset-x-0 top-6 mx-auto max-w-6xl px-4 sm:top-auto sm:bottom-0 sm:px-6 sm:pb-36">
          <p className="text-xs font-semibold tracking-wider text-cream/80 uppercase">
            Điểm đến
          </p>
          <OceanamiLockup className="mt-3 drop-shadow-[0_4px_12px_rgba(26,22,20,0.35)]" />
          <h1 id={labelId} className="mt-3 font-serif text-title text-cream">
            {HERO_TITLE}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/90 sm:mt-3 sm:text-lead">
            {HERO_SUBTITLE}
          </p>
          <p className="mt-4 hidden text-sm font-medium text-cream/85 sm:block">{slide.caption}</p>
          <div className="mt-5 hidden items-center gap-3 sm:flex">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="inline-flex size-11 items-center justify-center rounded-full bg-paper/90 text-ink shadow-[var(--shadow-border)] transition-transform duration-150 ease-out active:scale-[0.96]"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-5" />
            </button>
            <SlideDots index={index} onSelect={go} />
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="inline-flex size-11 items-center justify-center rounded-full bg-paper/90 text-ink shadow-[var(--shadow-border)] transition-transform duration-150 ease-out active:scale-[0.96]"
              aria-label="Ảnh tiếp"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-52 z-10 px-4 sm:hidden">
          <p className="text-center text-sm font-medium text-cream/90">{slide.caption}</p>
          <div className="mt-2 flex justify-center">
            <SlideDots index={index} onSelect={go} />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-5 z-10 mx-auto max-w-4xl px-4 sm:bottom-7 sm:px-6">
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
              onChange={(next) => onChange(next)}
            />
            <GuestField guests={guests} onChange={(value) => onChange({ guests: value })} />
          </FieldSplit>
          <Button type="submit" size="lg" className="md:mr-1 md:px-8">
            Xem villa
          </Button>
        </form>
      </div>
    </section>
  );
}

function SlideDots({
  index,
  onSelect,
}: {
  index: number;
  onSelect: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Chọn ảnh">
      {HERO_SLIDES.map((item, slideIndex) => (
        <button
          key={item.file}
          type="button"
          role="tab"
          aria-selected={slideIndex === index}
          aria-label={`Ảnh ${slideIndex + 1}: ${item.caption}`}
          onClick={() => onSelect(slideIndex)}
          className={cn(
            "h-11 min-w-11 px-1",
            "inline-flex items-center justify-center",
          )}
        >
          <span
            className={cn(
              "block h-2 rounded-full transition-all duration-200",
              slideIndex === index ? "w-6 bg-cream" : "w-2 bg-cream/50",
            )}
          />
        </button>
      ))}
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

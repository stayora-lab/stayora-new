import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Photo } from "@/components/photo";
import type { StayImage } from "@/lib/villas";
import { cn } from "@/lib/utils";

export function VillaGallery({ images, name }: { images: StayImage[]; name: string }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const hero = images[0];
  const rest = images.slice(1, 5);

  function openAt(index: number) {
    setActive(index);
    setOpen(true);
  }

  return (
    <>
      <div className="relative grid gap-2 md:grid-cols-4 md:grid-rows-2 md:h-[min(62vh,36rem)]">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="relative h-64 overflow-hidden rounded-lg md:col-span-2 md:row-span-2 md:h-full md:rounded-l-2xl md:rounded-r-lg"
        >
          {hero ? <Photo src={hero.src} alt={hero.alt} /> : null}
        </button>
        {rest.map((image, index) => (
          <button
            type="button"
            key={image.src + index}
            onClick={() => openAt(index + 1)}
            className={cn(
              "relative hidden overflow-hidden md:block",
              index === 1 || index === 3 ? "md:rounded-r-2xl" : "rounded-lg",
              index > 1 && rest.length < 3 ? "md:hidden" : "",
            )}
          >
            <Photo src={image.src} alt={image.alt} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute right-3 bottom-3 rounded-full bg-paper/95 px-4 py-2 text-sm font-medium shadow-[var(--shadow-border)] md:right-4 md:bottom-4"
        >
          See all photos
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0">
          <DialogTitle className="sr-only">{name} photos</DialogTitle>
          <div className="bg-ink">
            <div className="relative aspect-photo max-h-[70vh] w-full">
              {images[active] ? (
                <Photo src={images[active].src} alt={images[active].alt} />
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto p-3">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.src}
                  onClick={() => setActive(index)}
                  className={cn(
                    "h-16 w-24 shrink-0 overflow-hidden rounded-md",
                    active === index ? "ring-2 ring-cream" : "opacity-70",
                  )}
                >
                  <Photo src={image.src} alt={image.alt} />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

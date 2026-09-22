import { cn } from "@/lib/utils";

export function Photo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("size-full object-cover photo-frame", className)}
    />
  );
}

export function VillaPlaceholder({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-cream-deep text-center",
        className,
      )}
    >
      <p className="px-4 font-serif text-xl text-ink-soft sm:text-2xl">{name}</p>
    </div>
  );
}

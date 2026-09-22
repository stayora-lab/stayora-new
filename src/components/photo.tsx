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
      <div className="px-4">
        <p className="font-serif text-xl text-ink-soft sm:text-2xl">{name}</p>
        <p className="mt-2 text-sm text-muted">Ảnh thật sẽ được cập nhật</p>
      </div>
    </div>
  );
}

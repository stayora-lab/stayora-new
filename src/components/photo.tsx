import { isIllustration } from "@/lib/photos";
import { cn } from "@/lib/utils";

export function Photo({
  src,
  alt,
  className,
  eager,
  illustration,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  illustration?: boolean;
}) {
  const showCaption = illustration ?? isIllustration(src);
  return (
    <span className={cn("relative block size-full overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : "low"}
        className="size-full object-cover photo-frame"
      />
      {showCaption ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-medium tracking-wide text-cream">
          Ảnh minh hoạ
        </span>
      ) : null}
    </span>
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

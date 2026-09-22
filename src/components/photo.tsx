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

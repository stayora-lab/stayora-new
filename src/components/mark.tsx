import { cn } from "@/lib/utils";

/** Official Stayora lockup — lotus + custom wordmark from stayora.vn */
export function StayoraLockup({
  variant = "color",
  className,
}: {
  variant?: "color" | "white";
  className?: string;
}) {
  return (
    <img
      src={variant === "white" ? "/brand/stayora-lockup-white.svg" : "/brand/stayora-lockup.svg"}
      alt="Stayora"
      className={cn("h-8 w-auto sm:h-9", className)}
    />
  );
}

export function StayoraMark({ className }: { className?: string }) {
  return <StayoraLockup className={className} />;
}

export function StayoraIcon({ className }: { className?: string }) {
  return (
    <img
      src="/brand/stayora-icon.svg"
      alt=""
      className={cn("h-8 w-auto", className)}
      aria-hidden="true"
    />
  );
}

type OceanamiTone = "on-photo" | "on-paper";

/**
 * Oceanami seal — Núi, Biển, Hoa Anh Đào.
 * The header export is a wide canvas; the UI uses the cropped square mark
 * so the emblem stays inside the viewport and keeps its color.
 */
export function OceanamiEmblem({
  className,
}: {
  tone?: OceanamiTone;
  className?: string;
}) {
  return (
    <img
      src="/brand/oceanami-mark.png"
      alt="Oceanami"
      width={96}
      height={96}
      className={cn("size-16 max-h-24 max-w-[40vw] shrink-0 object-contain sm:size-20", className)}
    />
  );
}

export function OceanamiLockup({
  className,
}: {
  tone?: OceanamiTone;
  compact?: boolean;
  className?: string;
}) {
  return <OceanamiEmblem className={className} />;
}

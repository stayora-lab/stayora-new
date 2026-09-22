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

/**
 * Official Oceanami seal from oceanami.com — Núi, Biển, Hoa Anh Đào.
 * Magenta circle; not the Stayora lotus.
 */
export function OceanamiEmblem({
  variant = "color",
  className,
}: {
  variant?: "color" | "white";
  className?: string;
}) {
  return (
    <img
      src={variant === "white" ? "/brand/oceanami-mark-white.png" : "/brand/oceanami-mark.png"}
      alt=""
      className={cn("h-8 w-8 shrink-0 object-contain", className)}
      aria-hidden="true"
    />
  );
}

export function OceanamiLockup({
  variant = "color",
  compact = false,
  className,
}: {
  variant?: "color" | "white";
  compact?: boolean;
  className?: string;
}) {
  return (
    <img
      src={variant === "white" ? "/brand/oceanami-lockup-white.png" : "/brand/oceanami-lockup.png"}
      alt="Oceanami Villas & Beach Club"
      className={cn(
        "w-auto object-contain object-left",
        compact ? "h-8 sm:h-9" : "h-10 sm:h-12",
        className,
      )}
    />
  );
}

/** Six Senses-style dual lockup: rental brand + destination. */
export function DualBrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <StayoraLockup />
      <span className="h-8 w-px bg-border-strong" aria-hidden />
      <OceanamiEmblem className="h-8 w-8 sm:hidden" />
      <OceanamiLockup compact className="hidden sm:block" />
    </span>
  );
}


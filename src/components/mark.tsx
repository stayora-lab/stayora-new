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

function oceanamiToneClass(tone: OceanamiTone) {
  return tone === "on-photo" ? "oceanami-mono-white" : "oceanami-mono-ink";
}

/**
 * Official Oceanami seal from oceanami.com — Núi, Biển, Hoa Anh Đào.
 * Always rendered monochrome in Stayora UI (CSS filter; files are untouched).
 */
export function OceanamiEmblem({
  tone = "on-paper",
  className,
}: {
  tone?: OceanamiTone;
  className?: string;
}) {
  return (
    <img
      src="/brand/oceanami-mark.png"
      alt=""
      className={cn("h-8 w-8 shrink-0 object-contain", oceanamiToneClass(tone), className)}
      aria-hidden="true"
    />
  );
}

export function OceanamiLockup({
  tone = "on-paper",
  compact = false,
  className,
}: {
  tone?: OceanamiTone;
  compact?: boolean;
  className?: string;
}) {
  return (
    <img
      src="/brand/oceanami-lockup.png"
      alt="Oceanami"
      className={cn(
        "w-auto object-contain object-left",
        compact ? "h-8 sm:h-9" : "h-10 sm:h-12",
        oceanamiToneClass(tone),
        className,
      )}
    />
  );
}

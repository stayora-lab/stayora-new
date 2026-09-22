import { Photo } from "@/components/photo";
import { formatDateRange, formatVnd, guestLabel, nightLabel } from "@/lib/stay";
import type { StayRequest } from "@/lib/domain";
import type { Villa } from "@/lib/villas";

export function StaySummary({
  villa,
  request,
  totalLabel = "Stay total",
}: {
  villa: Villa;
  request: Pick<StayRequest, "checkIn" | "checkOut" | "guests" | "nights" | "total">;
  totalLabel?: string;
}) {
  const hero = villa.images[0];
  return (
    <article className="overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]">
      <div className="grid sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="relative h-40 sm:h-full">
          {hero ? <Photo src={hero.src} alt="Ảnh minh hoạ" /> : null}
          <span className="absolute bottom-2 left-2 rounded-full bg-paper/92 px-2 py-0.5 text-[11px] text-muted">
            Ảnh minh hoạ
          </span>
        </div>
        <div className="space-y-2 p-5">
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">
            Oceanami · {villa.settingLabel}
          </p>
          <h2 className="font-medium">{villa.name}</h2>
          <p className="text-sm text-ink-soft">
            {formatDateRange(request.checkIn, request.checkOut)}
          </p>
          <p className="text-sm text-muted">
            {nightLabel(request.nights)} · {guestLabel(request.guests)}
          </p>
          <p className="text-sm">
            {totalLabel}{" "}
            <span className="font-medium tabular-nums">{formatVnd(request.total)}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { stayGuestLabel, viDateRange } from "@/lib/domain";
import type { Stay } from "@/lib/domain";
import { protectiveHoldNote, stayOffersHostFollowUp } from "@/lib/host-surface";
import { getVilla } from "@/lib/villas";

export function HostStayCard({
  stay,
  guestLabel,
  reference,
  bookingCancelled,
  onReport,
  onHold,
}: {
  stay: Stay;
  guestLabel: string;
  reference?: string;
  bookingCancelled?: boolean;
  onReport: (stayId: string) => void;
  onHold: (input: { villaId: string; start: string; end: string; note: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const villaName = getVilla(stay.villaId)?.name ?? stay.villaId;
  const dates = viDateRange(stay.checkIn, stay.checkOut);
  const followUp = stayOffersHostFollowUp(stay.status);
  const note = protectiveHoldNote({ confirmed: open, reason });

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{villaName}</p>
          <p className="mt-1 text-sm text-ink-soft">{guestLabel}</p>
        </div>
        <span className="shrink-0 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep">
          {stayGuestLabel(stay.status)}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">
        {dates} · {stay.guests} khách
      </p>
      <p className="mt-1 text-sm text-muted">{stay.originLabel}</p>
      {reference ? (
        <p className="mt-2 text-sm text-muted">
          Mã <span className="font-medium text-ink">{reference}</span>
          {bookingCancelled ? " · đã huỷ" : ""}
        </p>
      ) : null}
      {followUp ? (
        <div className="mt-4 grid gap-2">
          <Button className="w-full" onClick={() => onReport(stay.id)}>
            Báo việc
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
            Giữ bảo vệ
          </Button>
          {open ? (
            <div className="rounded-2xl bg-cream p-3">
              <p className="text-sm text-ink">
                Giữ bảo vệ {villaName}, {dates}. Chỗ mới sẽ bị chặn cho đến khi gỡ giữ.
              </p>
              <label className="mt-3 block text-sm">
                Lý do
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
                />
              </label>
              <Button
                className="mt-3 w-full"
                disabled={note === null}
                onClick={() => {
                  const confirmed = protectiveHoldNote({ confirmed: true, reason });
                  if (!confirmed) return;
                  onHold({
                    villaId: stay.villaId,
                    start: stay.checkIn,
                    end: stay.checkOut,
                    note: confirmed,
                  });
                  setOpen(false);
                  setReason("");
                }}
              >
                Xác nhận giữ
              </Button>
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setOpen(false)}>
                Huỷ
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

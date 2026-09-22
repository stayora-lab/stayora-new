import { Drawer } from "vaul";
import { useState } from "react";
import { DateRangeField, GuestField } from "@/components/dates-guests";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/lib/store";
import {
  bookability,
  formatDateRange,
  formatVnd,
  guestLabel,
  isIsoDate,
  nightLabel,
  nightsBetween,
} from "@/lib/stay";
import type { Villa } from "@/lib/villas";

type ExistingStay = {
  label: string;
  onOpen: () => void;
};

type Props = {
  villa: Villa;
  checkIn: string;
  checkOut: string;
  guests: number;
  onDates: (next: { checkIn: string; checkOut: string }) => void;
  onGuests: (guests: number) => void;
  onRequest: () => void;
  existing?: ExistingStay;
};

export function PriceBlock({
  villa,
  checkIn,
  checkOut,
}: {
  villa: Villa;
  checkIn: string;
  checkOut: string;
}) {
  const ready = isIsoDate(checkIn) && isIsoDate(checkOut) && nightsBetween(checkIn, checkOut) > 0;
  const nights = ready ? nightsBetween(checkIn, checkOut) : 0;
  const total = nights * villa.nightly;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xl font-semibold tabular-nums">{formatVnd(villa.nightly)}</p>
        <p className="text-sm text-muted">per night</p>
      </div>
      {ready ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-ink-soft">
            <span>
              {formatVnd(villa.nightly)} × {nightLabel(nights)}
            </span>
            <span className="tabular-nums">{formatVnd(total)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
            <span>Stay total</span>
            <span className="tabular-nums">{formatVnd(total)}</span>
          </div>
          <p className="text-muted">We'll confirm this total with your stay.</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Add dates to see the stay total.</p>
      )}
    </div>
  );
}

export function BookingForm({
  villa,
  checkIn,
  checkOut,
  guests,
  onDates,
  onGuests,
  onRequest,
  existing,
}: Props) {
  const world = useBookingStore((state) => state.world);
  const result = bookability(villa, checkIn, checkOut, guests, world);
  const canRequest = result.state === "ready" && !existing;

  let helper = "Your request will be sent for confirmation.";
  if (result.state === "unavailable") helper = "These dates aren't available to request.";
  if (result.state === "too-many-guests") {
    helper = `This villa sleeps up to ${result.sleeps} guests.`;
  }
  if (result.state === "missing-dates") helper = "Choose check-in and check-out to continue.";
  if (existing) helper = "You've already sent a request for these dates.";

  return (
    <div className="space-y-5">
      <PriceBlock villa={villa} checkIn={checkIn} checkOut={checkOut} />
      <div className="overflow-hidden rounded-xl bg-cream shadow-[var(--shadow-border)]">
        <DateRangeField
          villa={villa}
          world={world}
          checkIn={checkIn}
          checkOut={checkOut}
          onChange={onDates}
          className="rounded-none"
        />
        <div className="h-px bg-border" />
        <GuestField guests={guests} onChange={onGuests} className="rounded-none" />
      </div>
      {existing ? (
        <Button variant="ink" size="lg" className="w-full" onClick={existing.onOpen}>
          {existing.label}
        </Button>
      ) : (
        <Button size="lg" className="w-full" disabled={!canRequest} onClick={onRequest}>
          Request this stay
        </Button>
      )}
      <p className="text-center text-sm text-muted">{helper}</p>
    </div>
  );
}

export function BookingPanel(props: Props) {
  return (
    <aside className="rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      <BookingForm {...props} />
    </aside>
  );
}

export function MobileBookingBar(props: Props) {
  const [open, setOpen] = useState(false);
  const ready = isIsoDate(props.checkIn) && isIsoDate(props.checkOut);
  const nights = ready ? nightsBetween(props.checkIn, props.checkOut) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tabular-nums">
            {formatVnd(props.villa.nightly)}
            <span className="ml-1 font-normal text-muted">/ night</span>
          </p>
          <p className="truncate text-xs text-muted">
            {ready && nights > 0
              ? `${formatDateRange(props.checkIn, props.checkOut)} · ${guestLabel(props.guests)}`
              : "Add dates"}
          </p>
        </div>
        {props.existing ? (
          <Button size="lg" variant="ink" className="px-5" onClick={props.existing.onOpen}>
            {props.existing.label}
          </Button>
        ) : (
          <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
              <Button size="lg" className="px-5">
                Request
              </Button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-10">
                <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
                <p className="mb-4 font-serif text-3xl">Request {props.villa.name}</p>
                <BookingForm {...props} />
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        )}
      </div>
    </div>
  );
}

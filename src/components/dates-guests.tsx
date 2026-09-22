import { Drawer } from "vaul";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import type { Locale } from "date-fns";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  disabledMatchers,
  formatDateRange,
  guestLabel,
  isIsoDate,
} from "@/lib/stay";
import type { World } from "@/lib/domain";
import type { Villa } from "@/lib/villas";
import { cn } from "@/lib/utils";

function toRange(checkIn?: string, checkOut?: string): DateRange | undefined {
  if (!isIsoDate(checkIn)) return undefined;
  return {
    from: parseISO(checkIn),
    to: isIsoDate(checkOut) ? parseISO(checkOut) : undefined,
  };
}

function toIsoDate(date?: Date): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromRange(range: DateRange | undefined): { checkIn: string; checkOut: string } {
  return { checkIn: toIsoDate(range?.from), checkOut: toIsoDate(range?.to) };
}

function CalendarBody({
  villa,
  world,
  selected,
  onSelect,
  months,
  locale,
}: {
  villa?: Villa;
  world?: World;
  selected?: DateRange;
  onSelect: (range: DateRange | undefined) => void;
  months: number;
  locale?: Locale;
}) {
  return (
    <DayPicker
      mode="range"
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={months}
      disabled={disabledMatchers(villa, world)}
      defaultMonth={selected?.from}
      locale={locale}
    />
  );
}

export function DateRangeField({
  checkIn,
  checkOut,
  onChange,
  villa,
  world,
  align = "start",
  className,
  datesLabel = "Ngày",
  calendarTitle = "Bạn muốn ở những ngày nào?",
  placeholder = "Chọn ngày",
  formatLabel,
  locale,
}: {
  checkIn?: string;
  checkOut?: string;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
  villa?: Villa;
  world?: World;
  align?: "start" | "center" | "end";
  className?: string;
  datesLabel?: string;
  calendarTitle?: string;
  placeholder?: string;
  formatLabel?: (checkIn: string, checkOut: string) => string;
  locale?: Locale;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = toRange(checkIn, checkOut);
  const label =
    isIsoDate(checkIn) && isIsoDate(checkOut)
      ? (formatLabel ? formatLabel(checkIn, checkOut) : formatDateRange(checkIn, checkOut))
      : placeholder;

  function handleSelect(range: DateRange | undefined) {
    const next = fromRange(range);
    onChange(next);
    if (next.checkIn && next.checkOut && next.checkIn !== next.checkOut) {
      setOpen(false);
    }
  }

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex h-14 w-full min-w-0 flex-col items-start justify-center rounded-full px-5 text-left transition-colors hover:bg-cream-deep",
        className,
      )}
    >
      <span className="text-xs font-semibold tracking-wider text-muted uppercase">
        {datesLabel}
      </span>
      <span className="flex w-full items-center justify-between gap-2 font-medium">
        <span className="truncate">{label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </span>
    </button>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-4 pb-8">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            <p className="mb-3 font-serif text-2xl">{calendarTitle}</p>
            <CalendarBody
              villa={villa}
              world={world}
              selected={selected}
              onSelect={handleSelect}
              months={1}
              locale={locale}
            />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-4">
        <CalendarBody
          villa={villa}
          world={world}
          selected={selected}
          onSelect={handleSelect}
          months={2}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateField({
  date,
  onChange,
  label = "Ngày",
  calendarTitle = "Chọn ngày",
  formatLabel,
  locale,
  className,
}: {
  date: string;
  onChange: (date: string) => void;
  label?: string;
  calendarTitle?: string;
  formatLabel?: (date: string) => string;
  locale?: Locale;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = isIsoDate(date) ? parseISO(date) : undefined;
  const display = isIsoDate(date)
    ? formatLabel
      ? formatLabel(date)
      : date
    : "Chọn ngày";

  function handleSelect(next: Date | undefined) {
    if (!next) return;
    onChange(toIsoDate(next));
    setOpen(false);
  }

  const calendar = (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={handleSelect}
      defaultMonth={selected}
      locale={locale}
    />
  );

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-full bg-paper px-5 text-left shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <span>
        <span className="block text-xs font-semibold tracking-wider text-muted uppercase">
          {label}
        </span>
        <span className="font-medium">{display}</span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted" />
    </button>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-4 pb-8">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            <p className="mb-3 font-serif text-2xl">{calendarTitle}</p>
            {calendar}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-4">
        {calendar}
      </PopoverContent>
    </Popover>
  );
}

export function GuestField({
  guests,
  onChange,
  max = 16,
  className,
  label = "Khách",
  heading = "Ai sẽ đến?",
  peopleLabel = "Khách",
  peopleHint = "Tất cả người ở trong villa.",
  doneLabel = "Xong",
  valueLabel,
}: {
  guests: number;
  onChange: (guests: number) => void;
  max?: number;
  className?: string;
  label?: string;
  heading?: string;
  peopleLabel?: string;
  peopleHint?: string;
  doneLabel?: string;
  valueLabel?: (guests: number) => string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const shown = valueLabel ? valueLabel(guests) : guestLabel(guests);

  const controls = (
    <div className="flex items-center justify-between gap-6 py-2">
      <div>
        <p className="font-medium">{peopleLabel}</p>
        <p className="text-sm text-muted">{peopleHint}</p>
      </div>
      <Stepper value={guests} min={1} max={max} onChange={onChange} />
    </div>
  );

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex h-14 w-full min-w-0 flex-col items-start justify-center rounded-full px-5 text-left transition-colors hover:bg-cream-deep",
        className,
      )}
    >
      <span className="text-xs font-semibold tracking-wider text-muted uppercase">
        {label}
      </span>
      <span className="flex w-full items-center justify-between gap-2 font-medium">
        <span className="truncate">{shown}</span>
        <ChevronDown className="size-4 shrink-0 text-muted" />
      </span>
    </button>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-8">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            <p className="mb-4 font-serif text-2xl">{heading}</p>
            {controls}
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
              {doneLabel}
            </Button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        {controls}
      </PopoverContent>
    </Popover>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Decrease guests"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-10 items-center justify-center rounded-full shadow-[var(--shadow-border)] disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-6 text-center font-medium tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase guests"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex size-10 items-center justify-center rounded-full shadow-[var(--shadow-border)] disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function FieldSplit({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-stretch divide-x divide-border">{children}</div>
  );
}

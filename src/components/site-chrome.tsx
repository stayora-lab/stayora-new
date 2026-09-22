import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useState, type ReactNode } from "react";
import { OceanamiLockup, StayoraLockup } from "@/components/mark";
import { Button } from "@/components/ui/button";
import type { Persona } from "@/lib/domain";
import { DESTINATION_COPY } from "@/lib/destination";
import { PILOT_SEED } from "@/lib/pilot-data";
import { useBookingStore } from "@/lib/store";

const PERSONAS: { id: Persona; label: string; to: string }[] = [
  { id: "GUEST", label: "Khách", to: "/" },
  { id: "SALE", label: "Sale", to: "/sale" },
  { id: "HOST", label: "Host", to: "/host" },
  { id: "BUTLER", label: "Butler", to: "/ops" },
  { id: "BQL", label: "BQL", to: "/ops" },
  { id: "ADMIN", label: "Stayora vận hành", to: "/admin" },
];

export function TrialBanner() {
  return (
    <p className="bg-ink px-3 py-2 text-center text-xs font-medium tracking-wide text-cream">
      Bản thử nghiệm — không có giao dịch thật.
    </p>
  );
}

export function PersonaSwitch() {
  const persona = useBookingStore((state) => state.persona);
  const demoMode = useBookingStore((state) => state.demoMode);
  const setRole = useBookingStore((state) => state.setRole);
  const navigate = useNavigate();
  if (!demoMode) return null;

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="hidden sm:inline">Vai</span>
      <select
        value={persona}
        onChange={(event) => {
          const next = event.target.value as Persona;
          if (next === "SALE") {
            setRole({ persona: "SALE", saleId: PILOT_SEED.sales[0]?.id });
          } else if (next === "HOST") {
            setRole({ persona: "HOST", hostId: PILOT_SEED.hosts[0]?.id });
          } else if (next === "BUTLER") {
            setRole({ persona: "BUTLER", butlerId: PILOT_SEED.butlers[0]?.id });
          } else {
            setRole({ persona: next });
          }
          const target = PERSONAS.find((item) => item.id === next);
          if (target) void navigate({ to: target.to });
        }}
        className="h-9 max-w-44 rounded-full bg-paper px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]"
      >
        {PERSONAS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DestinationChip() {
  return (
    <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-paper px-3 text-xs font-medium text-ink-soft shadow-[var(--shadow-border)] sm:text-sm">
      Điểm đến: Oceanami
    </span>
  );
}

export function SiteHeader() {
  const hydrated = useBookingStore((state) => state.hydrated);
  const persona = useBookingStore((state) => state.persona);
  const world = useBookingStore((state) => state.world);
  const fetchedAt = useBookingStore((state) => state.fetchedAt);
  const latest = world.requests.find((item) => item.source === "GUEST");
  const latestBooking = latest
    ? world.bookings.find((item) => item.requestId === latest.id)
    : undefined;
  const path = useRouterState({ select: (state) => state.location.pathname });
  const workspace =
    path.startsWith("/sale") ||
    path.startsWith("/ops") ||
    path.startsWith("/host") ||
    path.startsWith("/admin");
  const stamp = fetchedAt ? format(parseISO(fetchedAt), "HH:mm:ss") : null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-cream/90 backdrop-blur-md">
      <TrialBanner />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="shrink-0" aria-label="Stayora home">
            <StayoraLockup />
          </Link>
          {workspace ? (
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm text-ink-soft">{workspaceTitle(path, persona)}</p>
              {stamp ? <p className="text-xs text-muted">Cập nhật lúc {stamp}</p> : null}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <DestinationChip />
          {hydrated && persona === "GUEST" && latest ? (
            latestBooking ? (
              <Link
                to="/your-stay/$stayId"
                params={{ stayId: latestBooking.stayId }}
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep sm:inline"
              >
                Kỳ nghỉ của bạn
              </Link>
            ) : (
              <Link
                to="/requests/$requestId"
                params={{ requestId: latest.id }}
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep sm:inline"
              >
                Yêu cầu của bạn
              </Link>
            )
          ) : null}
          {stamp ? (
            <p className="text-xs text-muted md:hidden">Cập nhật lúc {stamp}</p>
          ) : null}
          <PersonaSwitch />
        </div>
      </div>
    </header>
  );
}

function workspaceTitle(path: string, persona: Persona): string {
  if (path.startsWith("/sale")) return "Sale · Oceanami";
  if (path.startsWith("/host")) return "Host · Oceanami";
  if (path.startsWith("/admin")) return "Stayora vận hành";
  if (persona === "BQL") return "BQL Oceanami · Hôm nay";
  if (path.startsWith("/ops")) return "Butler · Hôm nay";
  return "Oceanami · Phước Hải";
}

export function SiteFooter() {
  const persona = useBookingStore((state) => state.persona);
  if (persona !== "GUEST") return null;
  return (
    <footer className="border-t border-border bg-cream-deep/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted uppercase">
            Thương hiệu đặt phòng · Stayora
          </p>
          <div className="mt-3">
            <StayoraLockup />
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Villa do chủ nhà sở hữu và cho thuê. Stayora vận hành đặt phòng và thanh toán.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">
            Điểm đến · Oceanami
          </p>
          <div className="mt-3 sm:flex sm:justify-end">
            <OceanamiLockup tone="on-paper" />
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted sm:ml-auto">
            {DESTINATION_COPY.about.body}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function StayoraServiceNote({
  reference,
  payment,
}: {
  reference?: string;
  payment?: string;
}) {
  return (
    <div className="mt-6 space-y-2 rounded-2xl bg-paper p-5 shadow-[var(--shadow-border)]">
      {reference ? (
        <p className="text-sm">
          <span className="text-muted">Mã xác nhận Stayora</span>{" "}
          <span className="font-medium text-ink">{reference}</span>
        </p>
      ) : null}
      {payment ? (
        <p className="text-sm">
          <span className="text-muted">Thanh toán Stayora</span>{" "}
          <span className="text-ink">{payment}</span>
        </p>
      ) : null}
      <p className="text-sm text-muted">Hỗ trợ Stayora — đặt phòng và thanh toán.</p>
    </div>
  );
}

export function DestinationAbout() {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">Về điểm đến</p>
      <OceanamiLockup tone="on-paper" className="mt-4" />
      <p className="mt-3 max-w-md text-sm text-ink-soft">{DESTINATION_COPY.about.body}</p>
    </section>
  );
}

export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const persona = useBookingStore((state) => state.persona);
  const advanceDemo = useBookingStore((state) => state.advanceDemo);
  const resetWorld = useBookingStore((state) => state.resetWorld);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-3 bottom-3 z-40 rounded-full bg-paper px-3 py-2 text-xs font-medium text-muted shadow-[var(--shadow-border)]"
      >
        Demo
      </button>
    );
  }

  return (
    <div className="fixed right-3 bottom-3 z-40 w-56 rounded-2xl bg-paper p-3 shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wider text-muted uppercase">
          Bảng điều khiển demo
        </p>
        <button type="button" className="text-xs text-muted" onClick={() => setOpen(false)}>
          Đóng
        </button>
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => void advanceDemo()}>
        Tua nhanh 30 phút
      </Button>
      {persona === "ADMIN" ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            if (window.confirm("Nạp lại dữ liệu thử?")) void resetWorld();
          }}
        >
          Nạp lại dữ liệu thử
        </Button>
      ) : null}
    </div>
  );
}

export function RoleGate({ allow, children }: { allow: Persona[]; children: ReactNode }) {
  const hydrated = useBookingStore((state) => state.hydrated);
  const persona = useBookingStore((state) => state.persona);
  if (!hydrated) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center text-muted">Đang mở dữ liệu…</main>
    );
  }
  if (!allow.includes(persona)) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Cần đúng link vai trò</h1>
        <p className="mt-3 text-ink-soft">
          Trang này không mở bằng vai đang lưu trên thiết bị. Dùng link được gửi cho bạn.
        </p>
      </main>
    );
  }
  return children;
}

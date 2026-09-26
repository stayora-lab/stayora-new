import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { OceanamiLockup, StayoraIcon, StayoraLockup } from "@/components/mark";
import { Button } from "@/components/ui/button";
import type { Persona } from "@/lib/domain";
import { DESTINATION_COPY, LOCATION_LABEL } from "@/lib/destination";
import { PILOT_SEED } from "@/lib/pilot-data";
import { workspaceFor } from "@/lib/role";
import { showDemoPersonaSwitch } from "@/lib/site-header";
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

function grantLabel(role: string, scopeRef: string | null): string {
  if (role === "HOST") return `Host · ${scopeRef ?? ""}`;
  if (role === "SALE") return `Sale · ${scopeRef ?? ""}`;
  if (role === "BUTLER") return `Butler · ${scopeRef ?? ""}`;
  if (role === "BQL") return "BQL";
  if (role === "ADMIN") return "Stayora vận hành";
  return role;
}

export function ContextSwitch() {
  const identity = useBookingStore((state) => state.identity);
  const grants = useBookingStore((state) => state.grants);
  const grantId = useBookingStore((state) => state.grantId);
  const selectGrant = useBookingStore((state) => state.selectGrant);
  const navigate = useNavigate();
  const active = grants.filter((grant) => grant.status === "active");
  if (!identity || active.length < 2) return null;
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="hidden sm:inline">Vai</span>
      <select
        value={grantId ?? ""}
        onChange={(event) => {
          const next = active.find((grant) => grant.id === event.target.value);
          if (!next) return;
          selectGrant(next.id);
          void navigate({ to: workspaceFor(next.role) });
        }}
        className="h-9 max-w-44 rounded-full bg-paper px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]"
      >
        {active.map((grant) => (
          <option key={grant.id} value={grant.id}>
            {grantLabel(grant.role, grant.scopeRef)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AccountChip() {
  const identity = useBookingStore((state) => state.identity);
  const grants = useBookingStore((state) => state.grants);
  const signOutIdentity = useBookingStore((state) => state.signOutIdentity);
  const active = grants.filter((grant) => grant.status === "active");
  if (!identity) {
    return (
      <Link
        to="/login"
        className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-ink hover:bg-cream-deep md:inline-flex"
      >
        Đăng nhập
      </Link>
    );
  }
  return (
    <div className="hidden items-center gap-2 md:flex">
      {active.length === 0 ? (
        <span className="text-xs text-muted">Đang chờ vai trò</span>
      ) : null}
      <span className="max-w-28 truncate text-sm text-ink-soft">{identity.name}</span>
      <button
        type="button"
        onClick={() => void signOutIdentity()}
        className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-ink hover:bg-cream-deep"
      >
        Thoát
      </button>
    </div>
  );
}

/** One icon on the mobile row. The words live in the menu, not in the bar. */
export function AccountMenu() {
  const identity = useBookingStore((state) => state.identity);
  const grants = useBookingStore((state) => state.grants);
  const signOutIdentity = useBookingStore((state) => state.signOutIdentity);
  const [open, setOpen] = useState(false);
  const active = grants.filter((grant) => grant.status === "active");

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        data-account-menu
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={identity ? identity.name : "Tài khoản"}
        className="inline-flex size-9 items-center justify-center rounded-full bg-paper text-ink shadow-[var(--shadow-border)]"
        onClick={() => setOpen((value) => !value)}
      >
        <User className="size-4" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          data-account-panel
          className="absolute right-0 z-40 mt-2 w-52 rounded-2xl bg-paper p-2 shadow-[var(--shadow-lift)]"
        >
          {identity ? (
            <>
              <p className="px-3 py-2 text-sm font-medium">{identity.name}</p>
              {active.length === 0 ? (
                <p className="px-3 pb-2 text-xs text-muted">Đang chờ vai trò</p>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="flex h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium"
                onClick={() => void signOutIdentity()}
              >
                Thoát
              </button>
            </>
          ) : (
            <Link
              to="/login"
              role="menuitem"
              className="flex h-11 items-center rounded-xl px-3 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
export function PersonaSwitch() {
  const persona = useBookingStore((state) => state.persona);
  const demoMode = useBookingStore((state) => state.demoMode);
  const identity = useBookingStore((state) => state.identity);
  const setRole = useBookingStore((state) => state.setRole);
  const navigate = useNavigate();
  if (!showDemoPersonaSwitch(demoMode, Boolean(identity))) return null;

  return (
    <label data-persona-switch className="flex items-center gap-2 text-xs text-muted">
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
        className="h-9 rounded-full bg-paper px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]"
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
    <span
      data-destination
      className="hidden h-9 shrink-0 items-center rounded-full bg-paper px-3 text-sm font-medium text-ink-soft shadow-[var(--shadow-border)] md:inline-flex"
    >
      Oceanami · Phước Hải
    </span>
  );
}

export function SiteHeader() {
  const hydrated = useBookingStore((state) => state.hydrated);
  const sessionReady = useBookingStore((state) => state.sessionReady);
  const persona = useBookingStore((state) => state.persona);
  const identity = useBookingStore((state) => state.identity);
  const grants = useBookingStore((state) => state.grants);
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
  const waiting =
    sessionReady && identity && !grants.some((grant) => grant.status === "active");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-cream/90 backdrop-blur-md">
      <TrialBanner />
      {waiting ? (
        <p className="bg-cream-deep px-3 py-2 text-center text-sm text-ink">
          Đang chờ Stayora cấp vai trò
        </p>
      ) : null}
      <div
        data-header-row
        className="mx-auto flex h-14 max-w-6xl flex-nowrap items-center justify-between gap-2 px-4 md:h-16 md:gap-3 md:px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="shrink-0" aria-label="Stayora">
            <StayoraIcon className="size-8 object-contain md:hidden" />
            <StayoraLockup className="hidden md:block" />
          </Link>
          {workspace ? (
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm text-ink-soft">{workspaceTitle(path, persona)}</p>
              {stamp ? <p className="text-xs text-muted">Cập nhật lúc {stamp}</p> : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DestinationChip />
          <ContextSwitch />
          <PersonaSwitch />
          <AccountMenu />
          <AccountChip />
          {hydrated && persona === "GUEST" && latest ? (
            latestBooking ? (
              <Link
                to="/your-stay/$stayId"
                params={{ stayId: latestBooking.stayId }}
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep md:inline"
              >
                Kỳ nghỉ của bạn
              </Link>
            ) : (
              <Link
                to="/requests/$requestId"
                params={{ requestId: latest.id }}
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep md:inline"
              >
                Yêu cầu của bạn
              </Link>
            )
          ) : null}
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
            Điểm đến · {LOCATION_LABEL}
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
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{LOCATION_LABEL}</p>
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

export function AdminAccess({
  configured,
  children,
}: {
  configured: boolean;
  children: ReactNode;
}) {
  if (!configured) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Chưa cấu hình ADMIN_KEY</h1>
      </main>
    );
  }
  return children;
}

export function RoleGate({ allow, children }: { allow: Persona[]; children: ReactNode }) {
  const hydrated = useBookingStore((state) => state.hydrated);
  const sessionReady = useBookingStore((state) => state.sessionReady);
  const persona = useBookingStore((state) => state.persona);
  const identity = useBookingStore((state) => state.identity);
  const grants = useBookingStore((state) => state.grants);
  if (!hydrated || !sessionReady) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center text-muted">Đang mở dữ liệu…</main>
    );
  }
  const active = grants.filter((grant) => grant.status === "active");
  if (identity && active.length === 0) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Đang chờ Stayora cấp vai trò</h1>
        <p className="mt-3 text-ink-soft">
          Tài khoản đã được tạo. Stayora vận hành sẽ cấp vai trò — bạn không tự nhận vai.
        </p>
      </main>
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

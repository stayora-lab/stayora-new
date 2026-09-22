import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { StayoraMark } from "@/components/mark";
import type { Persona } from "@/lib/domain";
import { useBookingStore } from "@/lib/store";

const PERSONAS: { id: Persona; label: string; to: string }[] = [
  { id: "GUEST", label: "Khách", to: "/" },
  { id: "SALE", label: "Sale", to: "/sale" },
  { id: "HOST", label: "Host", to: "/host" },
  { id: "BUTLER", label: "Butler", to: "/ops" },
  { id: "BQL", label: "BQL", to: "/ops" },
];

export function PersonaSwitch() {
  const persona = useBookingStore((state) => state.persona);
  const setPersona = useBookingStore((state) => state.setPersona);
  const navigate = useNavigate();

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="hidden sm:inline">Vai</span>
      <select
        value={persona}
        onChange={(event) => {
          const next = event.target.value as Persona;
          setPersona(next);
          const target = PERSONAS.find((item) => item.id === next);
          if (target) void navigate({ to: target.to });
        }}
        className="h-9 max-w-28 rounded-full bg-paper px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]"
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

export function SiteHeader() {
  const hydrated = useBookingStore((state) => state.hydrated);
  const persona = useBookingStore((state) => state.persona);
  const world = useBookingStore((state) => state.world);
  const latest = world.requests.find((item) => item.source === "GUEST");
  const latestBooking = latest
    ? world.bookings.find((item) => item.requestId === latest.id)
    : undefined;
  const path = useRouterState({ select: (state) => state.location.pathname });
  const workspace = path.startsWith("/sale") || path.startsWith("/ops") || path.startsWith("/host");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Stayora home">
          <StayoraMark />
        </Link>
        <p className="hidden min-w-0 truncate text-sm text-ink-soft md:block">
          {workspace ? workspaceTitle(path, persona) : "Oceanami · Phước Hải"}
        </p>
        <div className="flex items-center gap-2">
          {hydrated && persona === "GUEST" && latest ? (
            latestBooking ? (
              <Link
                to="/your-stay/$stayId"
                params={{ stayId: latestBooking.stayId }}
                className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep"
              >
                Your stay
              </Link>
            ) : (
              <Link
                to="/requests/$requestId"
                params={{ requestId: latest.id }}
                className="rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-cream-deep"
              >
                Your request
              </Link>
            )
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
  if (persona === "BQL") return "BQL Oceanami · Hôm nay";
  if (path.startsWith("/ops")) return "Butler · Hôm nay";
  return "Oceanami · Phước Hải";
}

export function SiteFooter() {
  const persona = useBookingStore((state) => state.persona);
  if (persona !== "GUEST") return null;
  return (
    <footer className="border-t border-border bg-cream-deep/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <StayoraMark />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Private villas in Vietnam. This first destination is Oceanami, on Phước Hải
            beach.
          </p>
        </div>
        <p className="text-sm text-muted">Oceanami · Phước Hải · Bà Rịa–Vũng Tàu</p>
      </div>
    </footer>
  );
}

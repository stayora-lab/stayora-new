import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchDevSignInGate, signInDevAccount } from "@/lib/dev-identity-api";
import { PILOT_SEED } from "@/lib/pilot-data";
import { workspaceFor } from "@/lib/role";
import { useBookingStore } from "@/lib/store";

export const Route = createFileRoute("/dev/accounts")({
  loader: async () => {
    const gate = await fetchDevSignInGate();
    if (!gate.enabled) throw notFound();
    return gate;
  },
  notFoundComponent: DevAccountsMissing,
  component: DevAccountsPage,
});

function DevAccountsMissing() {
  return (
    <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-title">Không có trang này</h1>
    </main>
  );
}

function DevAccountsPage() {
  const { password } = Route.useLoaderData();
  const navigate = useNavigate();
  const refreshIdentity = useBookingStore((state) => state.refreshIdentity);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function enter(email: string) {
    setPending(email);
    setError(null);
    try {
      const session = await signInDevAccount({ data: { email, password } });
      await refreshIdentity();
      const grant = session.grants.find((item) => item.status === "active");
      void navigate({ to: grant ? workspaceFor(grant.role) : "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đăng nhập được");
    } finally {
      setPending(null);
    }
  }

  return (
    <main lang="vi" className="mx-auto max-w-lg px-4 py-12">
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Chỉ dùng cho bản thử</p>
      <h1 className="mt-2 font-serif text-title">Tài khoản thử</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Toàn bộ tên và villa là giả. Mật khẩu chung:{" "}
        <span className="font-medium text-ink">{password}</span>
      </p>
      <p className="mt-2 text-sm text-muted">Không có xác minh email. Không dùng tài khoản thật.</p>
      {error ? <p className="mt-4 text-sm text-lotus-deep">{error}</p> : null}
      <ul className="mt-8 space-y-3">
        {(PILOT_SEED.people ?? []).map((person) => (
          <li
            key={person.id}
            className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
          >
            <p className="font-medium">{person.name}</p>
            <p className="text-sm text-muted">{person.email}</p>
            {person.note ? <p className="mt-1 text-sm text-ink-soft">{person.note}</p> : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={pending === person.email}
              onClick={() => void enter(person.email)}
            >
              Đăng nhập tài khoản thử
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm">
        <Link to="/login" className="font-medium text-lotus">
          Đăng ký tài khoản mới
        </Link>
      </p>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RoleGate } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  adminGrantRole,
  adminRevokeRole,
  fetchDevDirectory,
} from "@/lib/dev-identity-api";
import { PILOT_SEED } from "@/lib/pilot-data";
import { useBookingStore } from "@/lib/store";

export const Route = createFileRoute("/admin_/roles")({
  loader: () => fetchDevDirectory(),
  component: RolesPage,
});

const ROLE_OPTIONS = ["HOST", "SALE", "BUTLER", "BQL"] as const;

function RolesPage() {
  const initial = Route.useLoaderData();
  const refreshIdentity = useBookingStore((state) => state.refreshIdentity);
  const [rows, setRows] = useState(initial);
  const [email, setEmail] = useState(PILOT_SEED.people?.[0]?.email ?? "");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("HOST");
  const [scopeRef, setScopeRef] = useState("host-an");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const next = await fetchDevDirectory();
    setRows(next);
    await refreshIdentity();
  }

  return (
    <RoleGate allow={["ADMIN"]}>
      <main lang="vi" className="mx-auto max-w-lg px-4 py-8">
        <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Stayora vận hành</p>
        <h1 className="mt-1 font-serif text-title">Cấp và thu hồi vai trò</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Vai trò do Stayora cấp. Tài khoản mới không có vai cho đến khi được cấp ở đây.
        </p>
        <form
          className="mt-6 space-y-3 rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            void adminGrantRole({
              data: { email, role, scopeRef: role === "BQL" ? null : scopeRef },
            })
              .then(reload)
              .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : "Không cấp được"),
              );
          }}
        >
          <label className="block text-sm">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl bg-cream px-3"
            />
          </label>
          <label className="block text-sm">
            Vai trò
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as (typeof ROLE_OPTIONS)[number])}
              className="mt-1 h-11 w-full rounded-xl bg-cream px-3"
            >
              {ROLE_OPTIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {role === "HOST" || role === "SALE" || role === "BUTLER" ? (
            <label className="block text-sm">
              Phạm vi
              <input
                value={scopeRef}
                onChange={(event) => setScopeRef(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl bg-cream px-3"
              />
            </label>
          ) : null}
          {error ? <p className="text-sm text-lotus-deep">{error}</p> : null}
          <Button type="submit">Cấp vai trò</Button>
        </form>
        <ul className="mt-8 space-y-4">
          {rows.map(({ user, grants }) => (
            <li key={user.id} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted">{user.email}</p>
              <ul className="mt-3 space-y-2">
                {grants.length === 0 ? (
                  <li className="text-sm text-ink-soft">Đang chờ Stayora cấp vai trò</li>
                ) : (
                  grants.map((grant) => (
                    <li key={grant.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {grant.role}
                        {grant.scopeRef ? ` · ${grant.scopeRef}` : ""} · {grant.status}
                      </span>
                      {grant.status === "active" ? (
                        <button
                          type="button"
                          className="text-lotus"
                          onClick={() => {
                            void adminRevokeRole({ data: { grantId: grant.id } }).then(reload);
                          }}
                        >
                          Thu hồi
                        </button>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </li>
          ))}
        </ul>
      </main>
    </RoleGate>
  );
}

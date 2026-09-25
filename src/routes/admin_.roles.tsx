import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountLookupResult } from "@/components/account-lookup";
import { SearchSelect } from "@/components/search-select";
import { AdminAccess, RoleGate } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_PENDING_ROLE,
  ACCOUNT_SUGGESTION_LABEL,
  ACCOUNT_SUGGESTION_MISS,
  isServerAccountMissing,
  presentAccountLookup,
} from "@/lib/account-lookup";
import {
  adminGrantRole,
  adminRevokeRole,
  fetchDevDirectory,
  lookupAccountGrants,
} from "@/lib/dev-identity-api";
import type { DevGrantRow, DevUser } from "@/lib/dev-types";
import { DESTINATION_NAME, PILOT_SEED } from "@/lib/pilot-data";
import { accountPickerItems, villaPickerItems } from "@/lib/search-select";
import { fetchAdminStatus } from "@/lib/world-api";
import { useBookingStore } from "@/lib/store";
import { villas } from "@/lib/villas";

export const Route = createFileRoute("/admin_/roles")({
  loader: async () => {
    const [status, directory] = await Promise.all([fetchAdminStatus(), fetchDevDirectory()]);
    return { ...status, ...directory };
  },
  component: RolesPage,
});

const ROLE_OPTIONS = ["HOST", "SALE", "BUTLER", "BQL"] as const;

type DirectoryRow = { user: DevUser; grants: DevGrantRow[] };

function RolesPage() {
  const initial = Route.useLoaderData();
  const adminKey = useBookingStore((state) => state.adminKey);
  const refreshIdentity = useBookingStore((state) => state.refreshIdentity);
  const [rows, setRows] = useState(initial.directory);
  const [devDirectory, setDevDirectory] = useState(initial.devDirectory);
  const [email, setEmail] = useState(
    initial.devDirectory ? (PILOT_SEED.people?.[0]?.email ?? "") : "",
  );
  const [accountQuery, setAccountQuery] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("HOST");
  const [villaIds, setVillaIds] = useState<string[]>([]);
  const [found, setFound] = useState<DirectoryRow | null>(null);
  const [lookupMiss, setLookupMiss] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const villaItems = villaPickerItems(villas, DESTINATION_NAME);
  const accountItems = accountPickerItems(rows.map((row) => row.user));
  const waiting = rows.filter((row) => !row.grants.some((grant) => grant.status === "active"));
  const holding = rows.filter((row) => row.grants.some((grant) => grant.status === "active"));
  const foundInRoster = Boolean(found && rows.some((row) => row.user.id === found.user.id));
  const lookedUpAccount = found && !foundInRoster ? found : null;
  const lookedUp = lookedUpAccount ? presentAccountLookup(lookedUpAccount) : null;

  useEffect(() => {
    if (!highlightedId) return;
    document.getElementById(`account-${highlightedId}`)?.scrollIntoView({ block: "nearest" });
  }, [highlightedId, rows, found]);

  async function reloadDirectory() {
    const next = await fetchDevDirectory();
    setRows(next.directory);
    setDevDirectory(next.devDirectory);
    await refreshIdentity();
  }

  async function showAccount(target = email) {
    setError(null);
    setLookupMiss(null);
    const lookup = target.trim();
    if (!lookup) {
      setError("Chọn một tài khoản");
      return;
    }
    try {
      const account = await lookupAccountGrants({ data: { email: lookup, key: adminKey } });
      setFound(account);
      setEmail(account.user.email);
      return account;
    } catch (err) {
      setFound(null);
      const message = err instanceof Error ? err.message : "Không thấy tài khoản";
      if (isServerAccountMissing(message)) setLookupMiss(lookup);
      else setError(message);
      return null;
    }
  }

  return (
    <AdminAccess configured={initial.configured}>
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
              setNotice(null);
              if (!email) {
                setError("Chọn một tài khoản");
                return;
              }
              const label = accountItems.find((item) => item.id === email)?.name ?? email;
              const count = villaIds.length;
              void adminGrantRole({
                data: {
                  email,
                  role,
                  villaIds: role === "HOST" || role === "BUTLER" ? villaIds : undefined,
                  key: adminKey,
                },
              })
                .then(async () => {
                  const villaBit =
                    role === "HOST" || role === "BUTLER" ? ` · ${count} villa` : "";
                  setNotice(`Đã cấp vai trò ${role}${villaBit} cho ${label}.`);
                  const account = await showAccount(email);
                  setHighlightedId(account?.user.id ?? null);
                  await reloadDirectory();
                })
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : "Không cấp được"),
                );
            }}
          >
            <SearchSelect
              label="Tài khoản"
              items={accountItems}
              selectedIds={email ? [email] : []}
              multiple={false}
              placeholder="Tìm theo tên hoặc email"
              query={accountQuery}
              onQueryChange={setAccountQuery}
              listLabel={ACCOUNT_SUGGESTION_LABEL}
              missMessage={ACCOUNT_SUGGESTION_MISS}
              hideListUntilQuery={!devDirectory}
              onChange={(ids) => {
                const next = ids[0] ?? "";
                setEmail(next);
                const row = rows.find((item) => item.user.email === next);
                if (row) setFound(row);
                else if (!next) setFound(null);
              }}
            />
            <label className="block text-sm">
              Vai trò
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as (typeof ROLE_OPTIONS)[number]);
                  setVillaIds([]);
                  setNotice(null);
                }}
                className="mt-1 h-11 w-full rounded-xl bg-cream px-3"
              >
                {ROLE_OPTIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            {role === "HOST" || role === "BUTLER" ? (
              <div>
                <SearchSelect
                  key={role}
                  label="Villa"
                  items={villaItems}
                  selectedIds={villaIds}
                  multiple
                  onChange={setVillaIds}
                />
                <p className="mt-2 text-xs text-muted">
                  Mỗi villa là một vai riêng. Chọn nhiều villa thì cấp nhiều vai, không gộp thành một mã.
                </p>
              </div>
            ) : role === "SALE" ? (
              <p className="text-sm text-muted">
                Sale không gắn với villa. Hoa hồng ghi theo tài khoản này, không theo mã gõ tay.
              </p>
            ) : null}
            {error ? <p className="text-sm text-lotus-deep">{error}</p> : null}
            {notice ? (
              <p className="text-sm text-moss" role="status">
                {notice}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => void showAccount(email || accountQuery)}>
                Xem vai trò
              </Button>
              <Button type="submit">Cấp vai trò</Button>
            </div>
            {lookupMiss ? <AccountLookupResult status="missing" email={lookupMiss} /> : null}
          </form>
          {lookedUpAccount && lookedUp?.status === "found" ? (
            <AccountLookupResult status="found" pending={lookedUp.pending}>
              <AccountGrants
                user={lookedUpAccount.user}
                grants={lookedUpAccount.grants}
                tone="lookup"
                highlighted={lookedUpAccount.user.id === highlightedId}
                onRevoke={(grantId) => {
                  void adminRevokeRole({ data: { grantId, key: adminKey } })
                    .then(async () => {
                      await reloadDirectory();
                      await showAccount(lookedUpAccount.user.email);
                    })
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : "Không thu hồi được"),
                    );
                }}
              />
            </AccountLookupResult>
          ) : null}
          {devDirectory ? (
            <>
              <Roster
                title="Đang chờ Stayora cấp vai trò"
                rows={waiting}
                highlightedId={highlightedId}
                onRevoke={(grantId) => {
                  void adminRevokeRole({ data: { grantId, key: adminKey } })
                    .then(reloadDirectory)
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : "Không thu hồi được"),
                    );
                }}
              />
              <Roster
                title="Đang giữ vai trò"
                rows={holding}
                highlightedId={highlightedId}
                onRevoke={(grantId) => {
                  void adminRevokeRole({ data: { grantId, key: adminKey } })
                    .then(reloadDirectory)
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : "Không thu hồi được"),
                    );
                }}
              />
            </>
          ) : (
            <p className="mt-8 text-sm text-muted">
              Danh sách tài khoản thử không mở khi đăng nhập thử đang tắt. Gõ email rồi bấm Xem vai trò.
            </p>
          )}
        </main>
      </RoleGate>
    </AdminAccess>
  );
}

function Roster({
  title,
  rows,
  highlightedId,
  onRevoke,
}: {
  title: string;
  rows: DirectoryRow[];
  highlightedId: string | null;
  onRevoke: (grantId: string) => void;
}) {
  if (rows.length === 0) return null;
  const waiting = title.startsWith("Đang chờ");
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">{title}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((row) => (
          <li key={row.user.id}>
            <AccountGrants
              user={row.user}
              grants={row.grants}
              tone={waiting ? "waiting" : "holding"}
              highlighted={row.user.id === highlightedId}
              onRevoke={onRevoke}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function scopeLabel(role: string, scopeRef: string): string {
  const villa = villas.find((item) => item.id === scopeRef);
  if (villa) return `${villa.name} · ${villa.id}`;
  if (role === "SALE" || role === "BQL") return scopeRef;
  const legacy = [
    ...PILOT_SEED.hosts.map((person) => person.id),
    ...PILOT_SEED.butlers.map((person) => person.id),
    ...(PILOT_SEED.bql ?? []).map((person) => person.id),
  ];
  if (legacy.includes(scopeRef)) return scopeRef;
  return `${scopeRef} · không phải villa — thu hồi rồi cấp lại`;
}

function AccountGrants({
  user,
  grants,
  onRevoke,
  tone,
  highlighted,
}: {
  user: DevUser;
  grants: DevGrantRow[];
  onRevoke: (grantId: string) => void;
  tone: "waiting" | "holding" | "lookup";
  highlighted: boolean;
}) {
  const active = grants.filter((grant) => grant.status === "active");
  return (
    <article
      id={`account-${user.id}`}
      className={`rounded-2xl p-4 shadow-[var(--shadow-border)] ${
        highlighted
          ? "bg-lotus-soft"
          : tone === "waiting"
            ? "border border-dashed border-border bg-cream"
            : "bg-paper"
      }`}
    >
      {highlighted ? <p className="text-xs font-semibold text-lotus">Vừa cấp vai trò</p> : null}
      <p className="font-medium">{user.name}</p>
      <p className="text-sm text-muted">{user.email}</p>
      <ul className="mt-3 space-y-2">
        {active.length === 0 && tone !== "lookup" ? (
          <li className="text-sm text-ink-soft">{ACCOUNT_PENDING_ROLE}</li>
        ) : null}
        {grants.map((grant) => (
          <li key={grant.id} className="flex items-center justify-between gap-3 text-sm">
            <span>
              {grant.role}
              {grant.scopeRef ? ` · ${scopeLabel(grant.role, grant.scopeRef)}` : ""} · {grant.status}
            </span>
            {grant.status === "active" ? (
              <button type="button" className="text-lotus" onClick={() => onRevoke(grant.id)}>
                Thu hồi
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountField, AccountLookupResult } from "@/components/account-lookup";
import { SearchSelect } from "@/components/search-select";
import { AdminAccess, RoleGate } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_PENDING_ROLE,
  ACCOUNT_SEARCH_DEBOUNCE_MS,
  accountSearchPhase,
  accountSearchQuery,
  isServerAccountMissing,
  presentAccountLookup,
  type AccountSearchRemote,
} from "@/lib/account-lookup";
import {
  adminGrantRole,
  adminRevokeRole,
  fetchDevDirectory,
  lookupAccountGrants,
  searchAccounts,
} from "@/lib/dev-identity-api";
import type { DevGrantRow, DevUser } from "@/lib/dev-types";
import { DESTINATION_NAME, PILOT_SEED } from "@/lib/pilot-data";
import {
  GRANT_ROLES,
  grantReview,
  grantRoleNeedsVillas,
  type GrantRoleId,
} from "@/lib/grant-form";
import { villaPickerItems } from "@/lib/search-select";
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
  const [remote, setRemote] = useState<AccountSearchRemote | null>(null);
  const [picked, setPicked] = useState<{ name: string; email: string } | null>(null);
  const [role, setRole] = useState<GrantRoleId | null>(null);
  const [villaIds, setVillaIds] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [found, setFound] = useState<DirectoryRow | null>(null);
  const [lookupMiss, setLookupMiss] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const villaItems = villaPickerItems(villas, DESTINATION_NAME);
  const waiting = rows.filter((row) => !row.grants.some((grant) => grant.status === "active"));
  const holding = rows.filter((row) => row.grants.some((grant) => grant.status === "active"));
  const foundInRoster = Boolean(found && rows.some((row) => row.user.id === found.user.id));
  const lookedUpAccount = found && !foundInRoster ? found : null;
  const lookedUp = lookedUpAccount ? presentAccountLookup(lookedUpAccount) : null;
  const rosterUser = rows.find((row) => row.user.email === email)?.user;
  const accountLabel =
    (picked?.email === email ? picked.name : null) ??
    rosterUser?.name ??
    (found?.user.email === email ? found.user.name : email);
  const selected = email ? { name: accountLabel || email, email } : null;
  const searchPhase = accountSearchPhase(accountQuery, remote);
  const villaLabels = villaIds.map((id) => {
    const villa = villas.find((item) => item.id === id);
    return villa ? `${villa.name} (${villa.id})` : id;
  });
  const summary = grantReview({ role, accountLabel, villaLabels });

  useEffect(() => {
    if (!highlightedId) return;
    document.getElementById(`account-${highlightedId}`)?.scrollIntoView({ block: "nearest" });
  }, [highlightedId, rows, found]);

  useEffect(() => {
    const decision = accountSearchQuery(accountQuery);
    if (!decision.ready) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchAccounts({ data: { query: decision.needle, key: adminKey } })
        .then((result) => {
          if (cancelled) return;
          setRemote({ settledQuery: decision.needle, accounts: result.accounts });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setRemote({ settledQuery: decision.needle, accounts: [], failed: true });
          setError(err instanceof Error ? err.message : "Không tìm được tài khoản");
        });
    }, ACCOUNT_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accountQuery, adminKey]);

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

  function pickAccount(hit: { name: string; email: string }) {
    setPicked(hit);
    setEmail(hit.email);
    setAccountQuery("");
    setRemote(null);
    setReviewing(false);
    setLookupMiss(null);
    void showAccount(hit.email);
  }

  function clearAccount() {
    setPicked(null);
    setEmail("");
    setAccountQuery("");
    setFound(null);
    setLookupMiss(null);
    setReviewing(false);
  }

  async function confirmGrant() {
    if (!role || !summary.ready) {
      setReviewing(false);
      setError(summary.ready ? "Chọn một vai trò" : summary.reason);
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await adminGrantRole({
        data: {
          email,
          role,
          villaIds: grantRoleNeedsVillas(role) ? villaIds : undefined,
          key: adminKey,
        },
      });
      setNotice(`Đã cấp. ${summary.title}.`);
      setReviewing(false);
      setVillaIds([]);
      const account = await showAccount(email);
      setHighlightedId(account?.user.id ?? null);
      await reloadDirectory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không cấp được");
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
              if (!summary.ready) {
                setReviewing(false);
                setError(summary.reason);
                return;
              }
              setReviewing(true);
            }}
          >
            <AccountField
              query={accountQuery}
              onQueryChange={(value) => {
                setAccountQuery(value);
                setReviewing(false);
                if (value.trim().toLowerCase() !== email.toLowerCase()) {
                  setEmail("");
                  setPicked(null);
                }
              }}
              onPick={pickAccount}
              onSubmitQuery={(value) => void showAccount(value || email)}
              phase={searchPhase}
              hits={remote?.accounts ?? []}
              selected={selected}
              onClear={clearAccount}
            />
            <fieldset>
              <legend className="text-sm">Vai trò</legend>
              <div role="radiogroup" aria-label="Vai trò" className="mt-2 grid grid-cols-2 gap-2">
                {GRANT_ROLES.map((item) => {
                  const chosen = role === item.id;
                  return (
                    <label
                      key={item.id}
                      className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium ${
                        chosen ? "bg-ink text-cream" : "bg-cream text-ink"
                      }`}
                    >
                      <input
                        type="radio"
                        name="grant-role"
                        value={item.id}
                        checked={chosen}
                        onChange={() => {
                          setRole(item.id);
                          setVillaIds([]);
                          setReviewing(false);
                          setNotice(null);
                          setError(null);
                        }}
                        className="size-4 accent-ink"
                      />
                      {item.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {grantRoleNeedsVillas(role) ? (
              <div>
                <SearchSelect
                  key={role}
                  label="Villa"
                  items={villaItems}
                  selectedIds={villaIds}
                  multiple
                  onChange={(ids) => {
                    setVillaIds(ids);
                    setReviewing(false);
                  }}
                  selectedAsChipsOnly
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
            {reviewing && summary.ready ? (
              <div data-grant-review className="rounded-xl bg-cream p-3 text-sm">
                <p className="font-medium">{summary.title}</p>
                <p className="mt-1 text-ink-soft">{summary.detail}</p>
                <div className="mt-3 flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setReviewing(false)}>
                    Sửa lại
                  </Button>
                  <Button type="button" onClick={() => void confirmGrant()}>
                    Xác nhận cấp
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => void showAccount(email || accountQuery)}>
                  Xem vai trò
                </Button>
                <Button type="submit">Xem lại</Button>
              </div>
            )}
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
              Danh sách tài khoản thử không mở khi đăng nhập thử đang tắt. Gõ tên hoặc email ở ô Tài khoản — kết quả lấy từ cơ sở dữ liệu.
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

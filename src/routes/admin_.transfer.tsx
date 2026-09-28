import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AccountField } from "@/components/account-lookup";
import { AdminAccess, RoleGate } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_SEARCH_DEBOUNCE_MS,
  accountSearchPhase,
  accountSearchQuery,
  type AccountSearchRemote,
} from "@/lib/account-lookup";
import { searchAccounts } from "@/lib/dev-identity-api";
import { BASIS_ADMIN_EXCEPTION } from "@/lib/hosting-transfer-model";
import { fetchAdminTransferPreview, submitAdminReplace } from "@/lib/hosting-transfer-api";
import { fetchAdminStatus } from "@/lib/world-api";
import { useBookingStore } from "@/lib/store";
import { villas } from "@/lib/villas";

export const Route = createFileRoute("/admin_/transfer")({
  loader: () => fetchAdminStatus(),
  component: AdminTransferPage,
});

function AdminTransferPage() {
  const { configured } = Route.useLoaderData();
  const adminKey = useBookingStore((state) => state.adminKey);
  const [unitId, setUnitId] = useState(villas[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<AccountSearchRemote | null>(null);
  const [hits, setHits] = useState<{ id: string; name: string; email: string }[]>([]);
  const [picked, setPicked] = useState<{ id: string; name: string; email: string } | null>(null);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<{
    primaryIdentityId: string | null;
    cohosts: { identityId: string; name: string; email: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const decision = accountSearchQuery(query);
    if (!decision.ready) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchAccounts({ data: { query: decision.needle, key: adminKey } })
        .then((result) => {
          if (cancelled) return;
          setHits(result.accounts);
          setRemote({ settledQuery: decision.needle, accounts: result.accounts });
        })
        .catch(() => {
          if (!cancelled) setRemote({ settledQuery: decision.needle, accounts: [], failed: true });
        });
    }, ACCOUNT_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, adminKey]);

  useEffect(() => {
    if (!unitId || !adminKey) return;
    let cancelled = false;
    void fetchAdminTransferPreview({ data: { unitId, key: adminKey } })
      .then((next) => {
        if (!cancelled) setPreview(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không mở được villa");
      });
    return () => {
      cancelled = true;
    };
  }, [unitId, adminKey]);

  const phase = accountSearchPhase(query, remote);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!picked) {
      setError("Chọn một tài khoản đã có");
      return;
    }
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await submitAdminReplace({
        data: { unitId, incomingIdentityId: picked.id, reason, key: adminKey },
      });
      setNotice("Đã thay chủ nhà chính. Co-host được giữ.");
      const next = await fetchAdminTransferPreview({ data: { unitId, key: adminKey } });
      setPreview(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thay được");
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminAccess configured={configured}>
      <RoleGate allow={["ADMIN"]}>
        <main lang="vi" className="mx-auto max-w-lg px-4 py-8" data-admin-transfer>
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Stayora vận hành</p>
          <h1 className="mt-1 font-serif text-title">Thay chủ nhà chính</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Ngoại lệ khi chuyển giao thường không làm được. Không cần đề cử hay chấp nhận. Cơ sở ghi nhận: {BASIS_ADMIN_EXCEPTION}.
          </p>
          <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
            <label className="block text-sm">
              Villa
              <select
                value={unitId}
                onChange={(event) => setUnitId(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
              >
                {villas.map((villa) => (
                  <option key={villa.id} value={villa.id}>
                    {villa.name}
                  </option>
                ))}
              </select>
            </label>
            {preview ? (
              <div className="text-sm text-ink-soft">
                <p>Chủ nhà chính hiện tại: {preview.primaryIdentityId ?? "chưa có"}</p>
                <p className="mt-1">
                  Co-host được giữ:{" "}
                  {preview.cohosts.length === 0
                    ? "không có"
                    : preview.cohosts.map((item) => item.name).join(", ")}
                </p>
              </div>
            ) : null}
            <AccountField
              query={query}
              onQueryChange={setQuery}
              onPick={(hit) => {
                const found = hits.find((item) => item.email === hit.email);
                if (!found) return;
                setPicked(found);
                setQuery("");
              }}
              onSubmitQuery={() => undefined}
              phase={phase}
              hits={hits}
              selected={picked}
              onClear={() => setPicked(null)}
            />
            <label className="block text-sm">
              Lý do
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
                required
              />
            </label>
            {error ? <p className="text-sm text-lotus-deep">{error}</p> : null}
            {notice ? <p className="text-sm">{notice}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              Thay chủ nhà chính
            </Button>
          </form>
        </main>
      </RoleGate>
    </AdminAccess>
  );
}

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
import { PAYOUT_MANUAL_NOTE } from "@/lib/hosting-payout-model";
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
  const [payoutChoice, setPayoutChoice] = useState<"" | "RETAIN" | "FOLLOW_INCOMING">("");
  const [preview, setPreview] = useState<{
    primaryIdentityId: string | null;
    cohosts: { identityId: string; name: string; email: string }[];
    payout: {
      pendingChoice: "RETAIN" | "FOLLOW_INCOMING" | null;
      lines: {
        bookingId: string;
        guestName: string;
        reference: string;
        checkIn: string;
        kind: "attributable" | "retained-locked" | "excluded";
        reason: string;
        retainedName: string | null;
      }[];
      recorded: { bookingId: string; retainedIdentityId: string; retainedName?: string | null }[];
    };
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
        data: {
          unitId,
          incomingIdentityId: picked.id,
          reason,
          payoutChoice: payoutChoice || null,
          key: adminKey,
        },
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
                <OpsPayout payout={preview.payout} />
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
            <fieldset className="text-sm" data-payout-admin-choice>
              <legend className="font-medium">Người nhận payout của cả nhóm</legend>
              <p className="mt-2 text-ink-soft" data-payout-ops>
                {PAYOUT_MANUAL_NOTE} Spec không nói vận hành được chọn thay. Prototype này ghi giúp chủ nhà chính đang
                ra, vì không có khoảng chờ. Người được giữ là chủ nhà đang ra, không phải vận hành. Bỏ trống thì không
                ghi gì.
              </p>
              <label className="mt-3 flex items-start gap-2">
                <input
                  type="radio"
                  name="payout-choice"
                  checked={payoutChoice === ""}
                  onChange={() => setPayoutChoice("")}
                />
                <span>Không chọn — mặc định theo chủ nhà tại lúc nhận phòng</span>
              </label>
              <label className="mt-2 flex items-start gap-2">
                <input
                  type="radio"
                  name="payout-choice"
                  checked={payoutChoice === "RETAIN"}
                  onChange={() => setPayoutChoice("RETAIN")}
                />
                <span>Giữ cả nhóm cho chủ nhà chính hiện tại</span>
              </label>
              <label className="mt-2 flex items-start gap-2">
                <input
                  type="radio"
                  name="payout-choice"
                  checked={payoutChoice === "FOLLOW_INCOMING"}
                  onChange={() => setPayoutChoice("FOLLOW_INCOMING")}
                />
                <span>Theo chủ nhà tại lúc nhận phòng</span>
              </label>
            </fieldset>
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

function OpsPayout({
  payout,
}: {
  payout: {
    lines: {
      bookingId: string;
      guestName: string;
      reference: string;
      checkIn: string;
      kind: "attributable" | "retained-locked" | "excluded";
      reason: string;
    }[];
    recorded: { bookingId: string; retainedIdentityId: string; retainedName?: string | null }[];
  };
}) {
  const attributable = payout.lines.filter((line) => line.kind === "attributable");
  const locked = payout.lines.filter((line) => line.kind === "retained-locked");
  const excluded = payout.lines.filter((line) => line.kind === "excluded");
  return (
    <div className="mt-3 space-y-2" data-payout-ops-cohort>
      <p data-payout-manual>{PAYOUT_MANUAL_NOTE}</p>
      <p>Trong nhóm: {attributable.length === 0 ? "không có" : attributable.map((line) => line.guestName).join(", ")}</p>
      {locked.length > 0 ? (
        <ul data-payout-locked>
          {locked.map((line) => (
            <li key={line.bookingId}>
              {line.guestName} — {line.reason}
            </li>
          ))}
        </ul>
      ) : null}
      {excluded.length > 0 ? (
        <ul data-payout-excluded>
          {excluded.map((line) => (
            <li key={line.bookingId}>
              {line.guestName} — {line.reason}
            </li>
          ))}
        </ul>
      ) : null}
      {payout.recorded.length > 0 ? (
        <ul>
          {payout.recorded.map((row) => (
            <li key={row.bookingId}>
              Đã ghi {row.bookingId} giữ cho {row.retainedName || row.retainedIdentityId}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

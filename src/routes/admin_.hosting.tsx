import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminAccess, RoleGate } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { fetchAdminStatus } from "@/lib/world-api";
import { decideAdminHostingUnit, fetchAdminHostingQueue } from "@/lib/hosting-api";
import {
  HOSTING_VERIFICATION_BASIS,
  PENDING_UNIT_COPY,
  type AdminRequestView,
} from "@/lib/hosting-model";
import { useBookingStore } from "@/lib/store";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/admin_/hosting")({
  loader: () => fetchAdminStatus(),
  component: AdminHostingPage,
});

function AdminHostingPage() {
  const { configured } = Route.useLoaderData();
  const adminKey = useBookingStore((state) => state.adminKey);
  const [rows, setRows] = useState<AdminRequestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!adminKey) return;
    let cancelled = false;
    void fetchAdminHostingQueue({ data: { key: adminKey } })
      .then((queue) => {
        if (!cancelled) {
          setError(null);
          setRows(queue);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không mở được hàng chờ");
      });
    return () => {
      cancelled = true;
    };
  }, [adminKey]);

  async function load() {
    const queue = await fetchAdminHostingQueue({ data: { key: adminKey } });
    setError(null);
    setRows(queue);
  }

  async function decide(unitRowId: string, outcome: "APPROVED" | "REJECTED") {
    const reason = (reasons[unitRowId] ?? "").trim();
    if (!reason) {
      setError("Cần một lý do ngắn");
      return;
    }
    setError(null);
    setBusy(unitRowId);
    try {
      await decideAdminHostingUnit({
        data: { unitRowId, outcome, reason, key: adminKey },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xử lý được");
      await load().catch(() => undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminAccess configured={configured}>
      <RoleGate allow={["ADMIN"]}>
        <main lang="vi" className="mx-auto max-w-lg px-4 py-8" data-admin-hosting-queue>
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Stayora vận hành</p>
          <h1 className="mt-1 font-serif text-title">Yêu cầu chủ nhà</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Duyệt từng villa. Một yêu cầu có thể được chấp nhận một phần. Cơ sở xác minh: {HOSTING_VERIFICATION_BASIS}.
          </p>
          <QueueBody
            rows={rows}
            error={error}
            reasons={reasons}
            busy={busy}
            onReason={(id, value) => setReasons((current) => ({ ...current, [id]: value }))}
            onDecide={(id, outcome) => void decide(id, outcome)}
          />
        </main>
      </RoleGate>
    </AdminAccess>
  );
}

function QueueBody({
  rows,
  error,
  reasons,
  busy,
  onReason,
  onDecide,
}: {
  rows: AdminRequestView[] | null;
  error: string | null;
  reasons: Record<string, string>;
  busy: string | null;
  onReason: (id: string, value: string) => void;
  onDecide: (id: string, outcome: "APPROVED" | "REJECTED") => void;
}) {
  return (
    <>
      {error ? <p className="mt-4 text-sm text-lotus-deep">{error}</p> : null}
      {rows === null && !error ? <p className="mt-6 text-sm text-muted">Đang mở dữ liệu…</p> : null}
      {rows && rows.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
          Không có yêu cầu đang chờ.
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        {rows?.map((request) => (
          <article key={request.requestId} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
            <p className="text-sm font-medium">{request.contactName}</p>
            <p className="mt-1 text-sm text-ink-soft">{request.contactEmail}</p>
            <p className="text-sm text-ink-soft">{request.contactPhone}</p>
            <ul className="mt-4 space-y-4">
              {request.units.map((unit) => {
                const villa = getVilla(unit.unitId);
                return (
                  <li key={unit.id} className="border-t border-border pt-3">
                    <p className="font-medium">{villa?.name ?? unit.unitId}</p>
                    <p className="mt-1 text-sm">
                      {unit.status === "PENDING" ? PENDING_UNIT_COPY : unit.status}
                    </p>
                    {unit.status === "PENDING" ? (
                      <div className="mt-3">
                        <label className="block text-sm">
                          Lý do
                          <input
                            value={reasons[unit.id] ?? ""}
                            onChange={(event) => onReason(unit.id, event.target.value)}
                            className="mt-1 h-11 w-full rounded-xl bg-cream px-3"
                          />
                        </label>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            disabled={busy === unit.id}
                            onClick={() => onDecide(unit.id, "APPROVED")}
                          >
                            Chấp nhận
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={busy === unit.id}
                            onClick={() => onDecide(unit.id, "REJECTED")}
                          >
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ) : unit.reason ? (
                      <p className="mt-1 text-sm text-muted">{unit.reason}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
}

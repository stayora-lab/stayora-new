import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchMyHostingRequests } from "@/lib/hosting-api";
import { PENDING_UNIT_COPY, type ApplicantRequestView } from "@/lib/hosting-model";
import { useBookingStore } from "@/lib/store";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/hosting-requests")({
  component: MyHostingRequestsPage,
});

function MyHostingRequestsPage() {
  const identity = useBookingStore((state) => state.identity);
  const sessionReady = useBookingStore((state) => state.sessionReady);
  const grants = useBookingStore((state) => state.grants);
  const selectGrant = useBookingStore((state) => state.selectGrant);
  const refreshIdentity = useBookingStore((state) => state.refreshIdentity);
  const navigate = useNavigate();
  const [rows, setRows] = useState<ApplicantRequestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = identity?.id;

  useEffect(() => {
    if (!sessionReady) return;
    if (!userId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    void Promise.all([fetchMyHostingRequests(), refreshIdentity()])
      .then(([list]) => {
        if (!cancelled) setRows(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof Error ? err.message : "Không mở được yêu cầu");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, sessionReady, refreshIdentity]);

  const hostGrant = grants.find((grant) => grant.status === "active" && grant.role === "HOST");

  return (
    <main lang="vi" className="mx-auto max-w-lg px-4 py-8" data-my-host-requests>
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Tài khoản</p>
      <h1 className="mt-1 font-serif text-title">Yêu cầu của tôi</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Trạng thái ghi trên từng villa. Tài khoản không đổi khi một villa còn chờ hoặc bị từ chối.
      </p>
      {!sessionReady || rows === null ? (
        <p className="mt-6 text-sm text-muted">Đang mở dữ liệu…</p>
      ) : !identity ? (
        <p className="mt-6 text-sm">
          <Link to="/login" className="font-medium">
            Đăng nhập để xem yêu cầu
          </Link>
        </p>
      ) : error ? (
        <p className="mt-6 text-sm text-lotus-deep">{error}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
          Bạn chưa gửi yêu cầu làm chủ nhà.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((request) => (
            <article key={request.requestId} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
              <ul className="space-y-3">
                {request.units.map((unit) => {
                  const villa = getVilla(unit.unitId);
                  return (
                    <li key={unit.id} data-unit-status={unit.status}>
                      <p className="font-medium">{villa?.name ?? unit.unitId}</p>
                      <p className="mt-1 text-sm">
                        {unit.status === "PENDING" ? PENDING_UNIT_COPY : unit.status}
                      </p>
                      {unit.status === "REJECTED" && unit.reason ? (
                        <p className="mt-1 text-sm text-ink-soft">{unit.reason}</p>
                      ) : null}
                      {unit.status === "APPROVED" && hostGrant ? (
                        <button
                          type="button"
                          className="mt-2 text-sm font-medium text-ink underline"
                          onClick={() => {
                            selectGrant(hostGrant.id);
                            void navigate({ to: "/host" });
                          }}
                        >
                          Vào không gian chủ nhà
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

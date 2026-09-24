import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { RoleGate, AdminAccess } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import {
  commitmentCellLabel,
  domainMessageVi,
  formatDueAt,
  obligationSucceeded,
  personaLabel,
  refundReasonVi,
  viDateRange,
} from "@/lib/domain";
import type { PaymentOutcome } from "@/lib/domain";
import { fetchAdminStatus } from "@/lib/world-api";
import { useBookingStore } from "@/lib/store";
import { formatVnd } from "@/lib/stay";
import { getVilla } from "@/lib/villas";
import { visibleGuestName } from "@/lib/privacy";

export const Route = createFileRoute("/admin")({
  loader: () => fetchAdminStatus(),
  component: AdminPage,
});

type AdminTab = "pay" | "unknown" | "refund" | "conflict" | "log";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "pay", label: "Thanh toán" },
  { id: "unknown", label: "Chưa rõ" },
  { id: "refund", label: "Hoàn tiền" },
  { id: "conflict", label: "Xung đột" },
  { id: "log", label: "Nhật ký" },
];

function AdminPage() {
  const { configured } = Route.useLoaderData();
  const world = useBookingStore((state) => state.world);
  const adminRecordPayment = useBookingStore((state) => state.adminRecordPayment);
  const adminResolveUnknown = useBookingStore((state) => state.adminResolveUnknown);
  const adminMarkRefundDone = useBookingStore((state) => state.adminMarkRefundDone);
  const adminResolveConflict = useBookingStore((state) => state.adminResolveConflict);
  const resetWorld = useBookingStore((state) => state.resetWorld);
  const [tab, setTab] = useState<AdminTab>("pay");
  const [error, setError] = useState<string | null>(null);
  const [reseedOpen, setReseedOpen] = useState(false);
  const [refundId, setRefundId] = useState<string | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [keepId, setKeepId] = useState("");
  const [endId, setEndId] = useState("");
  const [conflictReason, setConflictReason] = useState("");

  const unpaidInitial = world.obligations.filter((obligation) => {
    if (obligation.kind !== "INITIAL") return false;
    if (obligationSucceeded(world, obligation.id)) return false;
    const request = world.requests.find((item) => item.id === obligation.requestId);
    if (request?.status !== "ACCEPTED") return false;
    if (world.bookings.some((booking) => booking.requestId === obligation.requestId && booking.status === "CONFIRMED")) {
      return false;
    }
    return !world.attempts.some(
      (attempt) => attempt.obligationId === obligation.id && attempt.status === "UNKNOWN",
    );
  });
  const unpaidBalance = world.obligations.filter((obligation) => {
    if (obligation.kind !== "BALANCE") return false;
    if (obligationSucceeded(world, obligation.id)) return false;
    if (!world.bookings.some((booking) => booking.requestId === obligation.requestId && booking.status === "CONFIRMED")) {
      return false;
    }
    return !world.attempts.some(
      (attempt) => attempt.obligationId === obligation.id && attempt.status === "UNKNOWN",
    );
  });
  const unknowns = world.attempts.filter((item) => item.status === "UNKNOWN");
  const openRefunds = (world.refundCases ?? []).filter((item) => item.status === "OPEN");
  const openConflicts = (world.conflicts ?? []).filter((item) => item.status === "OPEN");
  const log = [...(world.auditLog ?? [])];
  const role = { persona: "ADMIN" as const };

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(domainMessageVi(err));
    }
  }

  const conflict = openConflicts.find((item) => item.id === conflictId);

  return (
    <AdminAccess configured={configured}>
    <RoleGate allow={["ADMIN"]}>
    <main lang="vi" className="pb-20">
      <div className="border-b border-border bg-cream">
        <div className="mx-auto max-w-lg px-4 pt-6 pb-4 sm:px-6">
          <p className="text-xs font-semibold tracking-wider text-lotus uppercase">
            Stayora vận hành
          </p>
          <h1 className="mt-1 font-serif text-title">Thanh toán, hoàn tiền, xung đột.</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setReseedOpen(true)}>
              Nạp lại dữ liệu thử
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/links">Link vai trò</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/images">Ảnh</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/roles">Vai trò</Link>
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-lotus-deep">{error}</p> : null}
        </div>
        <div className="sticky top-16 z-20 border-t border-border bg-cream/95 backdrop-blur-md">
          <div className="mx-auto grid max-w-lg grid-cols-5 px-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`h-12 px-1 text-[11px] font-medium sm:text-sm ${
                  tab === item.id
                    ? "border-b-2 border-ink text-ink"
                    : "border-b-2 border-transparent text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "pay" ? (
        <div className="mx-auto max-w-lg px-4 pt-5 sm:px-6">
          <Queue title="Ghi nhận thanh toán" empty="Không có khoản cần ghi.">
            {[...unpaidInitial, ...unpaidBalance].map((obligation) => {
              const request = world.requests.find((item) => item.id === obligation.requestId);
              const villa = request ? getVilla(request.villaId) : undefined;
              return (
                <article
                  key={obligation.id}
                  className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
                >
                  <p className="font-medium">{villa?.name ?? obligation.requestId}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {request
                      ? visibleGuestName(
                          { guestName: request.guestName, villaId: request.villaId, saleId: request.saleId },
                          role,
                        )
                      : null}
                  </p>
                  <p className="mt-2 text-sm">
                    {obligation.kind === "INITIAL" ? "Đợt đầu" : "Phần còn lại"} ·{" "}
                    <span className="font-semibold tabular-nums">{formatVnd(obligation.amount)}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">Hạn {formatDueAt(obligation.dueAt)}</p>
                  <PaymentButtons
                    onRecord={(outcome) => run(() => adminRecordPayment(obligation.id, outcome))}
                  />
                </article>
              );
            })}
          </Queue>
        </div>
      ) : null}

      {tab === "unknown" ? (
        <div className="mx-auto max-w-lg px-4 pt-5 sm:px-6">
          <Queue title="Thanh toán chưa xác định" empty="Không có khoản chưa rõ.">
            {unknowns.map((attempt) => {
              const obligation = world.obligations.find((item) => item.id === attempt.obligationId);
              const request = world.requests.find((item) => item.id === obligation?.requestId);
              return (
                <article
                  key={attempt.id}
                  className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
                >
                  <p className="font-medium">
                    {request ? getVilla(request.villaId)?.name : attempt.obligationId}
                  </p>
                  <p className="mt-2 text-sm text-lotus-deep">
                    Chưa xác định được kết quả thanh toán. Đừng thanh toán lại.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button onClick={() => run(() => adminResolveUnknown(attempt.id, "SUCCEEDED"))}>
                      Xác nhận đã nhận
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => run(() => adminResolveUnknown(attempt.id, "FAILED"))}
                    >
                      Xác nhận thất bại
                    </Button>
                  </div>
                </article>
              );
            })}
          </Queue>
        </div>
      ) : null}

      {tab === "refund" ? (
        <div className="mx-auto max-w-lg px-4 pt-5 sm:px-6">
          <Queue title="Cần hoàn tiền" empty="Không có khoản cần hoàn.">
            {openRefunds.map((refund) => {
              const request = world.requests.find((item) => item.id === refund.requestId);
              return (
                <article
                  key={refund.id}
                  className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
                >
                  <p className="font-medium">
                    {request ? getVilla(request.villaId)?.name : refund.requestId}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {request
                      ? visibleGuestName(
                          { guestName: request.guestName, villaId: request.villaId, saleId: request.saleId },
                          role,
                        )
                      : null}
                  </p>
                  <p className="mt-3 font-semibold tabular-nums">{formatVnd(refund.amount)}</p>
                  <p className="mt-1 text-sm text-muted">{refundReasonVi(refund.reason)}</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => {
                      setRefundId(refund.id);
                      setRefundNote("");
                    }}
                  >
                    Đánh dấu đã hoàn
                  </Button>
                </article>
              );
            })}
          </Queue>
        </div>
      ) : null}

      {tab === "conflict" ? (
        <div className="mx-auto max-w-lg px-4 pt-5 sm:px-6">
          <Queue title="Xung đột lịch" empty="Không có xung đột mở.">
            {openConflicts.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
              >
                <p className="font-medium">{getVilla(item.villaId)?.name}</p>
                <p className="mt-2 text-sm text-lotus-deep">Hai chỗ cùng lúc — không tự chọn bên thắng.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item.commitmentIds.map((id) => {
                    const commitment = world.commitments.find((row) => row.id === id);
                    if (!commitment) return null;
                    return (
                      <div key={id} className="rounded-xl bg-cream p-3 text-sm">
                        <p className="font-medium">{commitmentCellLabel(commitment)}</p>
                        <p className="mt-1 text-muted">
                          {viDateRange(commitment.start, commitment.end)}
                        </p>
                        <p className="mt-1 text-muted">{commitment.reference ?? commitment.id}</p>
                      </div>
                    );
                  })}
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    setConflictId(item.id);
                    setKeepId(item.commitmentIds[0] ?? "");
                    setEndId(item.commitmentIds[1] ?? "");
                    setConflictReason("");
                  }}
                >
                  Giải quyết
                </Button>
              </article>
            ))}
          </Queue>
        </div>
      ) : null}

      {tab === "log" ? (
        <div className="mx-auto max-w-lg px-4 pt-5 sm:px-6">
          <Queue title="Nhật ký" empty="Chưa có nhật ký.">
            {log.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]"
              >
                <p className="text-xs text-muted">{formatDueAt(entry.at)}</p>
                <p className="mt-1 font-medium">{entry.action}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {personaLabel(entry.persona)} · {entry.objectId}
                </p>
                {entry.reason ? <p className="mt-1 text-sm text-muted">{entry.reason}</p> : null}
              </article>
            ))}
          </Queue>
        </div>
      ) : null}

      <Drawer.Root open={Boolean(refundId)} onOpenChange={(open) => !open && setRefundId(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-10">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            <p className="font-serif text-2xl">Đánh dấu đã hoàn</p>
            <label className="mt-4 block text-sm">
              Ghi chú
              <input
                value={refundNote}
                onChange={(event) => setRefundNote(event.target.value)}
                className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
              />
            </label>
            <Button
              className="mt-5 w-full"
              disabled={!refundNote.trim()}
              onClick={() => {
                if (!refundId || !refundNote.trim()) return;
                run(() => adminMarkRefundDone(refundId, refundNote));
                setRefundId(null);
              }}
            >
              Đánh dấu đã hoàn
            </Button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={Boolean(conflict)} onOpenChange={(open) => !open && setConflictId(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-paper p-5 pb-10">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            <p className="font-serif text-2xl">Giải quyết xung đột</p>
            <p className="mt-2 text-sm text-muted">Chỉ kết thúc một commitment. Cần lý do.</p>
            {conflict ? (
              <>
                <label className="mt-4 block text-sm">
                  Giữ
                  <select
                    value={keepId}
                    onChange={(event) => setKeepId(event.target.value)}
                    className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
                  >
                    {conflict.commitmentIds.map((id) => {
                      const commitment = world.commitments.find((item) => item.id === id);
                      return (
                        <option key={id} value={id}>
                          {commitment ? commitmentCellLabel(commitment) : id}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="mt-3 block text-sm">
                  Kết thúc
                  <select
                    value={endId}
                    onChange={(event) => setEndId(event.target.value)}
                    className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
                  >
                    {conflict.commitmentIds.map((id) => {
                      const commitment = world.commitments.find((item) => item.id === id);
                      return (
                        <option key={id} value={id}>
                          {commitment ? commitmentCellLabel(commitment) : id}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="mt-3 block text-sm">
                  Lý do
                  <input
                    value={conflictReason}
                    onChange={(event) => setConflictReason(event.target.value)}
                    className="mt-1 h-12 w-full rounded-xl bg-cream px-4"
                  />
                </label>
                <Button
                  className="mt-5 w-full"
                  disabled={!conflictReason.trim() || keepId === endId}
                  onClick={() => {
                    run(() =>
                      adminResolveConflict({
                        conflictId: conflict.id,
                        keepCommitmentId: keepId,
                        endCommitmentId: endId,
                        reason: conflictReason,
                      }),
                    );
                    setConflictId(null);
                  }}
                >
                  Kết thúc commitment đã chọn
                </Button>
              </>
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <Drawer.Root open={reseedOpen} onOpenChange={setReseedOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-paper p-5 pb-10">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-sand" />
            <p className="font-serif text-2xl">Nạp lại dữ liệu thử</p>
            <p className="mt-2 text-sm text-ink-soft">
              Nạp lại sẽ thay toàn bộ dữ liệu phiên này bằng file thử. Các yêu cầu đang mở sẽ
              mất.
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReseedOpen(false)}>
                Huỷ
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  run(() => resetWorld());
                  setReseedOpen(false);
                }}
              >
                Nạp lại
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
    </RoleGate>
    </AdminAccess>
  );
}

function PaymentButtons({ onRecord }: { onRecord: (outcome: PaymentOutcome) => void }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {(
        [
          ["SUCCEEDED", "Thành công"],
          ["FAILED", "Thất bại"],
          ["UNKNOWN", "Không xác định"],
        ] as [PaymentOutcome, string][]
      ).map(([outcome, label]) => (
        <Button
          key={outcome}
          size="sm"
          variant={outcome === "SUCCEEDED" ? "primary" : "outline"}
          className="h-11 px-2 text-xs"
          onClick={() => onRecord(outcome)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function Queue({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  const count = items.length;
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="text-sm text-muted">{count}</p>
      </div>
      <div className="mt-3 space-y-3">
        {count === 0 ? (
          <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SearchSelect } from "@/components/search-select";
import { Button } from "@/components/ui/button";
import { submitHostingRequest } from "@/lib/hosting-api";
import { DESTINATION_NAME } from "@/lib/pilot-data";
import { villaPickerItems } from "@/lib/search-select";
import { useBookingStore } from "@/lib/store";
import { villas } from "@/lib/villas";

export const Route = createFileRoute("/host-request")({
  component: HostRequestPage,
});

function HostRequestPage() {
  const identity = useBookingStore((state) => state.identity);
  const sessionReady = useBookingStore((state) => state.sessionReady);
  const navigate = useNavigate();
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!identity) return;
    setContactName((current) => current || identity.name);
    setContactEmail((current) => current || identity.email);
  }, [identity]);

  const items = villaPickerItems(
    villas.map((villa) => ({
      id: villa.id,
      name: villa.name,
      destinationName: DESTINATION_NAME,
    })),
    DESTINATION_NAME,
  ).map((item) => {
    const villa = villas.find((row) => row.id === item.id);
    return villa && !villa.published ? { ...item, detail: `${item.id} · chưa niêm yết` } : item;
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!identity) {
      setError("Đăng nhập để gửi yêu cầu");
      return;
    }
    setPending(true);
    try {
      await submitHostingRequest({
        data: { unitIds, contactName, contactEmail, contactPhone },
      });
      void navigate({ to: "/hosting-requests" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được yêu cầu");
    } finally {
      setPending(false);
    }
  }

  return (
    <main lang="vi" className="mx-auto max-w-lg px-4 py-8" data-host-request-form>
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Oceanami</p>
      <h1 className="mt-1 font-serif text-title">Trở thành chủ nhà</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Chọn villa có trong danh mục. Stayora xác nhận từng villa. Tài khoản vẫn là khách cho đến khi một villa được chấp nhận.
      </p>
      <p className="mt-2 text-sm text-muted">Điểm đến: {DESTINATION_NAME}</p>
      {!sessionReady ? (
        <p className="mt-6 text-sm text-muted">Đang mở dữ liệu…</p>
      ) : !identity ? (
        <p className="mt-6 text-sm">
          <Link to="/login" className="font-medium text-ink">
            Đăng nhập để gửi yêu cầu
          </Link>
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
          <SearchSelect
            label="Villa"
            items={items}
            selectedIds={unitIds}
            onChange={setUnitIds}
            multiple
          />
          <label className="block text-sm">
            Tên liên hệ
            <input
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            Số điện thoại
            <input
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl bg-paper px-3 shadow-[var(--shadow-border)]"
              autoComplete="tel"
              required
            />
          </label>
          {error ? <p className="text-sm text-lotus-deep">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            Gửi yêu cầu
          </Button>
        </form>
      )}
    </main>
  );
}

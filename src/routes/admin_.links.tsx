import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGate } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { roleLinks } from "@/lib/role";
import { useBookingStore } from "@/lib/store";
import { fetchAdminStatus } from "@/lib/world-api";

export const Route = createFileRoute("/admin_/links")({
  loader: () => fetchAdminStatus(),
  component: RoleLinksPage,
});

function RoleLinksPage() {
  const { configured } = Route.useLoaderData();
  const [copied, setCopied] = useState<string | null>(null);
  const adminKey = useBookingStore((state) => state.adminKey);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const links = useMemo(() => roleLinks(), []);

  function hrefFor(vai: string): string {
    const params = new URLSearchParams({ vai });
    if (vai === "admin" && adminKey) params.set("key", adminKey);
    return `/?${params.toString()}`;
  }

  async function copy(vai: string) {
    const url = `${origin}${hrefFor(vai)}`;
    const ok = await copyText(url);
    setCopied(ok ? vai : null);
    window.setTimeout(() => setCopied(null), 2000);
  }

  if (!configured) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Chưa cấu hình ADMIN_KEY</h1>
      </main>
    );
  }

  return (
    <RoleGate allow={["ADMIN"]}>
    <main lang="vi" className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Field test</p>
      <h1 className="mt-1 font-serif text-title">Link vai trò</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Mỗi người mở link của mình trên điện thoại. Vai trò được nhớ trên thiết bị đó. Không
        cần đăng nhập. Không có giao dịch thật.
      </p>
      <ul className="mt-6 space-y-3">
        {links.map((item) => {
          const href = hrefFor(item.vai);
          return (
            <li key={item.vai} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
              <p className="font-medium">{item.label}</p>
              <p className="mt-1 break-all text-sm text-muted">
                {origin}
                {href}
              </p>
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={href}>Mở</a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => void copy(item.vai)}>
                  {copied === item.vai ? "Đã chép" : "Chép link"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-xs text-muted">
        Thêm <code>?demo=1</code> để hiện bộ chọn vai (chỉ dùng khi thử).
      </p>
    </main>
    </RoleGate>
  );
}

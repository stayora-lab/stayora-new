import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGate, AdminAccess } from "@/components/site-chrome";
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
    const params = new URLSearchParams({ demo: "1", vai });
    if (vai === "admin" && adminKey) params.set("key", adminKey);
    return `/?${params.toString()}`;
  }

  async function copy(vai: string) {
    const url = `${origin}${hrefFor(vai)}`;
    const ok = await copyText(url);
    setCopied(ok ? vai : null);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AdminAccess configured={configured}>
    <RoleGate allow={["ADMIN"]}>
    <main lang="vi" className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Field test</p>
      <h1 className="mt-1 font-serif text-title">Link vai trò</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Link này chỉ mở bộ chọn vai khi có <span className="font-medium">?demo=1</span>. Tài khoản
        thử đăng nhập tại trang tài khoản — vai trò do Stayora cấp, không tự nhận.
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
      <p className="mt-8 text-sm">
        <Link to="/dev/accounts" className="font-medium text-lotus">
          Tài khoản thử
        </Link>
      </p>
    </main>
    </RoleGate>
    </AdminAccess>
  );
}

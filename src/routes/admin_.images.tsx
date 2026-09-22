import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGate } from "@/components/site-chrome";
import { Photo } from "@/components/photo";
import { fetchAdminStatus } from "@/lib/world-api";
import { PHOTO_CATALOG } from "@/lib/photos";

export const Route = createFileRoute("/admin_/images")({
  loader: () => fetchAdminStatus(),
  component: AdminImagesPage,
});

function AdminImagesPage() {
  const { configured } = Route.useLoaderData();

  if (!configured) {
    return (
      <main lang="vi" className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-title">Chưa cấu hình ADMIN_KEY</h1>
      </main>
    );
  }

  const generated = PHOTO_CATALOG.filter((photo) => photo.type === "ai-generated");
  const real = PHOTO_CATALOG.filter((photo) => photo.type === "real");

  return (
    <RoleGate allow={["ADMIN"]}>
      <main lang="vi" className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Stayora vận hành</p>
        <h1 className="mt-1 font-serif text-title">Ảnh và nguồn</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          Ảnh minh hoạ đánh dấu type <span className="font-medium">ai-generated</span>. Để thay: thả
          file thật cùng tên vào thư mục đó rồi đổi type thành <span className="font-medium">real</span>{" "}
          trong SOURCES.json — không cần sửa code.
        </p>
        <p className="mt-2 text-sm text-muted">
          {generated.length} ảnh minh hoạ · {real.length} ảnh thật
        </p>
        <p className="mt-4">
          <Link to="/admin" className="text-sm font-medium text-lotus hover:text-lotus-deep">
            Về trang vận hành
          </Link>
        </p>
        <Group title="Ảnh minh hoạ — cần thay" items={generated} />
        <Group title="Ảnh thật" items={real} />
      </main>
    </RoleGate>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: typeof PHOTO_CATALOG;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-medium">{title}</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((photo) => (
          <li
            key={`${photo.folder}/${photo.file}`}
            className="overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-border)]"
          >
            <div className="relative aspect-photo">
              <Photo
                src={photo.src}
                alt={photo.file}
                illustration={photo.type === "ai-generated"}
              />
            </div>
            <div className="space-y-1 p-4 text-sm">
              <p className="font-medium">
                {photo.folder}/{photo.file}
              </p>
              <p className="text-muted">
                {photo.type === "ai-generated" ? "ai-generated" : "real"}
                {photo.sourceSite ? ` · ${photo.sourceSite}` : ""}
              </p>
              {photo.note ? <p className="text-ink-soft">{photo.note}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

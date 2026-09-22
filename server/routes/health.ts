import { defineHandler } from "nitro";

function present(name: string): boolean {
  const raw = process.env[name];
  return Boolean(raw && raw.trim());
}

export default defineHandler(() => ({
  ok: true,
  app: "stayora-field-test",
  node: process.version,
  vercel: present("VERCEL"),
  hasDatabaseUrl: present("DATABASE_URL"),
  hasAdminKey: present("ADMIN_KEY"),
  authFlag: process.env["VITE_AUTH_ENABLED"] ?? null,
}));

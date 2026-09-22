/**
 * Field-test diagnostics + AbortSignal polyfill.
 *
 * Grok-pwa middleware already runs on Vercel; this file uses the same
 * registration path so /health cannot be swallowed by TanStack, and so we can
 * attach `request.signal` before Start's SSR entry reads it.
 */
import { withAbortSignal } from "../lib/with-signal.ts";

function headerNames(headers: { keys?: () => Iterable<string> } | undefined): string[] {
  if (!headers) return [];
  try {
    if (typeof headers.keys === "function") return [...headers.keys()];
  } catch {
    /* ignore */
  }
  return Object.keys(headers);
}

function pathnameOf(event: { url?: URL; req?: { url?: string } }): string {
  try {
    if (event.url?.pathname) return event.url.pathname;
    if (event.req?.url) return new URL(event.req.url, "https://dev.stayora.vn").pathname;
  } catch {
    /* ignore */
  }
  return "";
}

function present(name: string): boolean {
  const raw = process.env[name];
  return Boolean(raw && raw.trim());
}

function healthBody(event: {
  url?: URL;
  req?: Request & { url?: string; method?: string; headers?: Headers; signal?: AbortSignal };
}) {
  const req = event.req;
  return {
    ok: true,
    app: "stayora-field-test",
    node: process.version,
    path: pathnameOf(event),
    method: req?.method ?? null,
    reqUrl: req?.url ?? null,
    extensible: req ? Object.isExtensible(req) : null,
    hasSignal: typeof req?.signal?.throwIfAborted === "function",
    headerNames: headerNames(req?.headers),
    accept: req?.headers?.get?.("accept") ?? null,
    vercel: present("VERCEL"),
    hasDatabaseUrl: present("DATABASE_URL"),
    hasAdminKey: present("ADMIN_KEY"),
    authFlag: process.env["VITE_AUTH_ENABLED"] ?? null,
  };
}

export default async function healthMiddleware(
  event: { url?: URL; req?: Request },
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  if (event.req) {
    try {
      event.req = withAbortSignal(event.req);
    } catch {
      /* assignment may fail on a read-only event; plugin still patches fetch */
    }
  }

  const path = pathnameOf(event);
  if (path === "/health") {
    return new Response(JSON.stringify(healthBody(event), null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  try {
    return await next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return new Response(
      JSON.stringify(
        {
          diagnostic: "middleware-catch",
          name: err.name,
          message: err.message,
          stack: err.stack,
          path,
          node: process.version,
          hasSignal: typeof event.req?.signal?.throwIfAborted === "function",
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }
}

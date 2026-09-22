/**
 * Zero-import field-test middleware (same scan path as grok-pwa.ts).
 *
 * 1. Attach AbortSignal — TanStack SSR crashes with opaque HTTPError when
 *    `request.signal` is missing on Vercel's Request-like object.
 * 2. Serve /health so we can tell this build is actually live.
 * 3. Fail-closed indexing: X-Robots-Tag on every response, plus /robots.txt.
 */
const ROBOTS_TAG = "noindex, nofollow";
const ROBOTS_TXT = "User-agent: *\nDisallow: /";

function withAbortSignal(req: Request): Request {
  if (typeof req?.signal?.throwIfAborted === "function") return req;
  const ac = new AbortController();
  try {
    Object.defineProperty(req, "signal", {
      configurable: true,
      enumerable: true,
      get: () => ac.signal,
    });
    if (typeof req.signal?.throwIfAborted === "function") return req;
  } catch {
    /* frozen / brand-checked Request */
  }
  return new Proxy(req, {
    get(target, prop, receiver) {
      if (prop === "signal") return ac.signal;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(target)
        : value;
    },
  }) as Request;
}

function pathOf(event: { url?: URL; req?: { url?: string } }): string {
  try {
    if (event.url?.pathname) return event.url.pathname;
    if (event.req?.url) return new URL(event.req.url, "https://localhost/").pathname;
  } catch {
    /* ignore */
  }
  return "";
}

function withRobotsTag(result: unknown): unknown {
  if (!(result instanceof Response)) return result;
  const headers = new Headers(result.headers);
  headers.set("X-Robots-Tag", ROBOTS_TAG);
  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers,
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return withRobotsTag(
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
  ) as Response;
}

export default async function healthMiddleware(
  event: { url?: URL; req?: Request },
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  if (event.req) {
    try {
      event.req = withAbortSignal(event.req);
    } catch {
      /* event.req may be read-only */
    }
  }

  const path = pathOf(event);
  if (path === "/robots.txt") {
    return withRobotsTag(
      new Response(ROBOTS_TXT, {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" },
      }),
    );
  }
  if (path === "/health") {
    const req = event.req;
    return jsonResponse({
      ok: true,
      app: "stayora-field-test",
      node: process.version,
      path,
      method: req?.method ?? null,
      hasSignal: typeof req?.signal?.throwIfAborted === "function",
      extensible: req ? Object.isExtensible(req) : null,
      vercel: Boolean(process.env.VERCEL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
      authFlag: process.env.VITE_AUTH_ENABLED ?? null,
    });
  }

  try {
    return withRobotsTag(await next());
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return jsonResponse(
      {
        diagnostic: "middleware-catch",
        name: err.name,
        message: err.message,
        stack: err.stack,
        path,
        node: process.version,
      },
      500,
    );
  }
}

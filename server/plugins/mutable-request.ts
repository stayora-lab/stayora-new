/**
 * Zero-import Nitro plugin. Vercel may hand a Request with no AbortSignal
 * and/or a frozen object Nitro cannot decorate. Patch before the app runs.
 */
type NitroApp = {
  fetch: (req: Request) => Promise<Response> | Response;
};

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
    /* frozen */
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

export default function mutableRequestPlugin(app: NitroApp) {
  const orig = app.fetch.bind(app);
  app.fetch = (incoming: Request) => {
    const req = withAbortSignal(incoming);
    try {
      (req as Request & { context?: Record<string, unknown> }).context ||= {};
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return new Response(
        JSON.stringify({
          diagnostic: "request-not-extensible",
          message: err.message,
          node: process.version,
        }),
        { status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
      );
    }
    try {
      return orig(req);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      return new Response(
        JSON.stringify({
          diagnostic: "nitro-fetch-throw",
          name: err.name,
          message: err.message,
          stack: err.stack,
          node: process.version,
        }),
        { status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
      );
    }
  };
}

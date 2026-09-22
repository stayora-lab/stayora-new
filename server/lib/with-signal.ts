/**
 * TanStack Start's SSR entry does `request.signal.throwIfAborted()` as its first
 * line. Some Vercel Node launchers hand us a Request-like object with no
 * AbortSignal — that TypeError is serialized as
 * `{"status":500,"unhandled":true,"message":"HTTPError"}`.
 */
export function withAbortSignal<T extends { signal?: AbortSignal }>(req: T): T {
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
    /* Request may be frozen / brand-checked */
  }

  return new Proxy(req, {
    get(target, prop, receiver) {
      if (prop === "signal") return ac.signal;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    },
  }) as T;
}

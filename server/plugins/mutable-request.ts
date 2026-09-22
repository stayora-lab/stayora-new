/**
 * Vercel Node 24 hands us a non-extensible Request. Nitro then does
 * `req.context ||= {}` and `req.runtime = …`, which throws and becomes the
 * opaque `{"status":500,"unhandled":true,"message":"HTTPError"}` testers hit.
 * Mutate first (or report why we cannot) so the real failure is visible.
 */
type NitroApp = {
  fetch: (req: Request) => Promise<Response> | Response;
};

function diagnostic(kind: string, error: unknown, req: Request): Response {
  const err = error instanceof Error ? error : new Error(String(error));
  return new Response(
    JSON.stringify(
      {
        diagnostic: kind,
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: (() => {
          try {
            return new URL(req.url).pathname;
          } catch {
            return undefined;
          }
        })(),
        node: process.version,
        extensible: Object.isExtensible(req),
        hasSignal: typeof req?.signal?.throwIfAborted === "function",
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

export default function mutableRequestPlugin(app: NitroApp) {
  const orig = app.fetch.bind(app);
  app.fetch = (req: Request) => {
    try {
      const mutable = req as Request & { context?: Record<string, unknown> };
      mutable.context ||= {};
    } catch (error) {
      return diagnostic("request-not-extensible", error, req);
    }
    try {
      return Promise.resolve(orig(req)).catch((error) =>
        diagnostic("nitro-fetch-reject", error, req),
      );
    } catch (error) {
      return diagnostic("nitro-fetch-throw", error, req);
    }
  };
}

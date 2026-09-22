import { defineErrorHandler } from "nitro";

function asError(error: unknown): {
  name?: string;
  message?: string;
  stack?: string;
  status?: number;
  unhandled?: boolean;
  cause?: unknown;
} {
  return error && typeof error === "object"
    ? (error as {
        name?: string;
        message?: string;
        stack?: string;
        status?: number;
        unhandled?: boolean;
        cause?: unknown;
      })
    : { message: String(error) };
}

function causePayload(cause: unknown) {
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message, stack: cause.stack };
  }
  if (cause == null) return undefined;
  return { message: String(cause) };
}

export default defineErrorHandler((error, event) => {
  const err = asError(error);
  const status = err.status && err.status >= 400 ? err.status : 500;
  return new Response(
    JSON.stringify(
      {
        diagnostic: "nitro-error-handler",
        status,
        name: err.name,
        message: err.message,
        unhandled: err.unhandled,
        stack: err.stack,
        cause: causePayload(err.cause),
        path: (() => {
          try {
            const url = (event as { url?: URL; req?: { url?: string } }).url;
            if (url?.pathname) return url.pathname;
            const raw = (event as { req?: { url?: string } }).req?.url;
            return raw ? new URL(raw).pathname : undefined;
          } catch {
            return undefined;
          }
        })(),
        node: process.version,
      },
      null,
      2,
    ),
    {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
});

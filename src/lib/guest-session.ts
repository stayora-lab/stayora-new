/**
 * PROTOTYPE ASSUMPTION. The creating browser keeps the raw bearer in
 * sessionStorage so a later read can send it. It is not put in the URL,
 * the world document, or localStorage. A new browser has no recovery path;
 * the spec leaves recovery unresolved.
 */

const KEY = "stayora.guest.access";

function readMap(): Record<string, string> {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function rememberGuestCredential(resourceId: string, credential: string): void {
  if (!resourceId || !credential || typeof sessionStorage === "undefined") return;
  const next = readMap();
  next[resourceId] = credential;
  sessionStorage.setItem(KEY, JSON.stringify(next));
}

export function readGuestCredential(resourceId: string): string | null {
  const value = readMap()[resourceId];
  return value || null;
}

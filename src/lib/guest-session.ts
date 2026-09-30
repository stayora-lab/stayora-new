/**
 * PROTOTYPE ASSUMPTION. The creating Guest browser keeps the raw bearer in
 * sessionStorage. It is not in the world document or localStorage.
 * Sale may hand the same bearer to the Guest once, in a URL hash. The hash is
 * not a resource id: the page copies it into sessionStorage and removes it.
 * The spec leaves recovery unresolved; this is delivery at creation, not recovery.
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

/** One-time Sale handoff. The hash is the bearer; the path is only the resource id. */
export function guestHandoffUrl(origin: string, requestId: string, credential: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/requests/${encodeURIComponent(requestId)}#${encodeURIComponent(credential)}`;
}

export function readHashCredential(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    value = raw;
  }
  value = value.trim();
  if (value.length < 32) return null;
  return value;
}

export function stripHashCredential(): void {
  if (typeof window === "undefined" || !window.location.hash) return;
  const url = new URL(window.location.href);
  url.hash = "";
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
}

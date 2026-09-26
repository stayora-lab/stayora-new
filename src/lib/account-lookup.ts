/**
 * Account search on the roles page, and the explicit lookup that follows it.
 *
 * The Tài khoản field asks the database as the operator types. It does not
 * filter the fictional test roster. Xem vai trò is the fallback for a typed
 * email with no suggestion chosen. A short query, an empty search, and a
 * database miss are three different sentences.
 */

export const ACCOUNT_SEARCH_MIN_LENGTH = 3;

/** Presentation cap for one keystroke. Not a limit on how many accounts exist. */
export const ACCOUNT_SEARCH_LIMIT = 20;

/** Wait before the live query so a keystroke is not its own request. */
export const ACCOUNT_SEARCH_DEBOUNCE_MS = 300;

export const ACCOUNT_SEARCH_SHORT = "Chưa gõ đủ để tìm";

export const ACCOUNT_SEARCH_MISS = "Không tìm thấy tài khoản nào khớp";

export const ACCOUNT_SEARCH_PENDING = "Đang tìm…";

export const ACCOUNT_LOOKUP_TITLE = "Tra cứu thật";

export const ACCOUNT_LOOKUP_MISS = "Không có tài khoản này trong cơ sở dữ liệu.";

export const ACCOUNT_LOOKUP_FOUND_NOTE =
  "Tài khoản này có trong cơ sở dữ liệu.";

export const ACCOUNT_PENDING_ROLE = "Chưa có vai trò đang mở.";

/** Server sentence for a database miss. The page does not show this raw. */
export const SERVER_ACCOUNT_MISSING = "Không thấy tài khoản này";

export type AccountSearchHit = {
  id: string;
  name: string;
  email: string;
};

export type AccountSearchQuery =
  | { ready: false; reason: "empty" | "short" }
  | { ready: true; needle: string };

export function accountSearchQuery(raw: string): AccountSearchQuery {
  const needle = raw.trim().toLowerCase();
  if (!needle) return { ready: false, reason: "empty" };
  if (needle.length < ACCOUNT_SEARCH_MIN_LENGTH) return { ready: false, reason: "short" };
  return { ready: true, needle };
}

/**
 * Case-insensitive substring on name or email.
 * The server query uses the same predicate (strpos on lower(email), lower(name)).
 */
export function matchAccounts<T extends { name: string; email: string }>(
  accounts: readonly T[],
  rawQuery: string,
): T[] {
  const decision = accountSearchQuery(rawQuery);
  if (!decision.ready) return [];
  const needle = decision.needle;
  return accounts
    .filter((account) => {
      const email = account.email.toLowerCase();
      const name = account.name.toLowerCase();
      return email.includes(needle) || name.includes(needle);
    })
    .sort((a, b) => a.email.localeCompare(b.email))
    .slice(0, ACCOUNT_SEARCH_LIMIT);
}

export type AccountSearchRemote = {
  settledQuery: string;
  accounts: readonly { name: string; email: string }[];
  failed?: boolean;
};

export type AccountSearchPhase = "idle" | "short" | "pending" | "empty" | "ready";

/** What the field may say. A new query stays pending until that exact search settles. */
export function accountSearchPhase(
  rawQuery: string,
  remote: AccountSearchRemote | null,
): AccountSearchPhase {
  const decision = accountSearchQuery(rawQuery);
  if (!decision.ready) return decision.reason === "empty" ? "idle" : "short";
  if (!remote || remote.settledQuery !== decision.needle) return "pending";
  if (remote.failed) return "idle";
  return remote.accounts.length > 0 ? "ready" : "empty";
}

export function accountSearchNotice(phase: AccountSearchPhase): string | null {
  if (phase === "short") return ACCOUNT_SEARCH_SHORT;
  if (phase === "pending") return ACCOUNT_SEARCH_PENDING;
  if (phase === "empty") return ACCOUNT_SEARCH_MISS;
  return null;
}

export function isServerAccountMissing(message: string): boolean {
  return message === SERVER_ACCOUNT_MISSING;
}

/** What Xem vai trò shows after the database answers. */
export function presentAccountLookup(
  account: {
    user: { name: string; email: string };
    grants: { status: string }[];
  } | null,
):
  | { status: "missing" }
  | { status: "found"; name: string; email: string; pending: boolean } {
  if (!account) return { status: "missing" };
  return {
    status: "found",
    name: account.user.name,
    email: account.user.email,
    pending: !account.grants.some((grant) => grant.status === "active"),
  };
}

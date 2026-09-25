/**
 * Two different "not found" states on the roles page.
 *
 * The account field only suggests names from the fictional test roster.
 * Xem vai trò is the database lookup. They must not share a sentence.
 */

export const ACCOUNT_SUGGESTION_LABEL = "Gợi ý từ danh sách thử";

export const ACCOUNT_SUGGESTION_MISS =
  "Không có gợi ý từ danh sách thử — bấm Xem vai trò để tra cứu thật";

export const ACCOUNT_LOOKUP_TITLE = "Tra cứu thật";

export const ACCOUNT_LOOKUP_MISS = "Không có tài khoản này trong cơ sở dữ liệu.";

export const ACCOUNT_LOOKUP_FOUND_NOTE =
  "Tài khoản này có trong cơ sở dữ liệu.";

export const ACCOUNT_PENDING_ROLE = "Chưa có vai trò đang mở.";

/** Server sentence for a database miss. The page does not show this raw. */
export const SERVER_ACCOUNT_MISSING = "Không thấy tài khoản này";

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


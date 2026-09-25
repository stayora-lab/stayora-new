/**
 * The roles form must not pick a role for the operator.
 * HOST used to be the default, so a submit that looked like "the villas I
 * ticked" wrote Chủ nhà. Nothing is selected until someone chooses.
 */

export const GRANT_ROLES = [
  { id: "HOST", label: "Chủ nhà" },
  { id: "SALE", label: "Sale" },
  { id: "BUTLER", label: "Quản gia" },
  { id: "BQL", label: "BQL" },
] as const;

export type GrantRoleId = (typeof GRANT_ROLES)[number]["id"];

export function grantRoleLabel(role: GrantRoleId): string {
  return GRANT_ROLES.find((item) => item.id === role)?.label ?? role;
}

export function grantRoleNeedsVillas(role: GrantRoleId | null): boolean {
  return role === "HOST" || role === "BUTLER";
}

export type GrantReview =
  | { ready: false; reason: string }
  | { ready: true; title: string; detail: string };

/** What the confirmation step must show before anything is written. */
export function grantReview(input: {
  role: GrantRoleId | null;
  accountLabel: string;
  villaLabels: readonly string[];
}): GrantReview {
  if (!input.role) return { ready: false, reason: "Chọn một vai trò" };
  const account = input.accountLabel.trim();
  if (!account) return { ready: false, reason: "Chọn một tài khoản" };
  const label = grantRoleLabel(input.role);
  if (grantRoleNeedsVillas(input.role)) {
    if (input.villaLabels.length === 0) return { ready: false, reason: "Chọn ít nhất một villa" };
    return {
      ready: true,
      title: `Cấp vai ${label} cho ${account}`,
      detail: `${input.villaLabels.join(", ")}. Mỗi villa là một vai riêng.`,
    };
  }
  return {
    ready: true,
    title: `Cấp vai ${label} cho ${account}`,
    detail:
      input.role === "SALE"
        ? "Không gắn villa. Hoa hồng ghi theo tài khoản này."
        : "Không gắn villa.",
  };
}

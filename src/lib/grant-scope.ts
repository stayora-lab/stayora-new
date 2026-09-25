/**
 * Villa scope for a role grant.
 *
 * Data shape: one grant per villa. scopeRef is exactly one villa id from the
 * catalogue. A submit with several villas writes several grants. It never
 * stores a typed string, and it never keeps only the first villa.
 *
 * SALE is not a villa scope. SALE scopeRef is the account id, because that id
 * is what commission and guest-name visibility already key on (saleId).
 */

export function assertVillaSelection(
  villaIds: readonly string[] | undefined,
  knownVillaIds: readonly string[],
): string[] {
  const unique = [...new Set((villaIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) throw new Error("Chọn ít nhất một villa");
  const known = new Set(knownVillaIds);
  if (unique.some((id) => !known.has(id))) {
    throw new Error("Villa không có trong danh sách");
  }
  return unique;
}

export function planRoleGrants(input: {
  role: string;
  villaIds?: readonly string[];
  knownVillaIds: readonly string[];
  accountId: string;
}): { scopeRef: string | null }[] {
  if (input.role === "ADMIN") {
    throw new Error("Tài khoản thử không được giữ vai Stayora vận hành");
  }
  if (input.role === "BQL") return [{ scopeRef: null }];
  if (input.role === "SALE") return [{ scopeRef: input.accountId }];
  if (input.role === "HOST" || input.role === "BUTLER") {
    return assertVillaSelection(input.villaIds, input.knownVillaIds).map((id) => ({
      scopeRef: id,
    }));
  }
  throw new Error("Vai trò không hợp lệ");
}

export function grantedVillaIds(
  grants: { role: string; scopeRef: string | null; status: string }[],
  role: string,
  knownVillaIds: readonly string[],
): string[] {
  const known = new Set(knownVillaIds);
  return grants
    .filter((grant) => grant.status === "active" && grant.role === role && grant.scopeRef && known.has(grant.scopeRef))
    .map((grant) => grant.scopeRef!);
}

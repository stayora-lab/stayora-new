/**
 * Searchable picker for the roles form.
 *
 * Presentation only. A grant is still one villa per row — this module never
 * builds a scope string.
 *
 * PROTOTYPE ASSUMPTION: forty matches are painted at a time so a large
 * catalogue does not become hundreds of checkboxes. That cap is not a limit
 * on how many villas a role may hold.
 *
 * Destination headings use the destination name on each item. The live seed
 * has one destination, Oceanami, the name recorded in
 * 13-destination-operations/. With one destination the heading is omitted.
 */

export const PICKER_PAGE_SIZE = 40;

export type PickerItem = {
  id: string;
  name: string;
  /** Secondary text, searched with the name and id. */
  detail?: string;
  /** Destination name. Headings appear only when matches span more than one. */
  group?: string | null;
};

export type PickerRow =
  | { kind: "heading"; key: string; label: string }
  | { kind: "item"; item: PickerItem };

export function filterPickerItems(items: readonly PickerItem[], query: string): PickerItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...items];
  return items.filter((item) => {
    const haystack = `${item.name} ${item.id} ${item.detail ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });
}

/** A typed query with nothing under it. An empty box is not a miss. */
export function isExplicitMiss(query: string, matchCount: number): boolean {
  return query.trim().length > 0 && matchCount === 0;
}

export function togglePickerSelection(
  selected: readonly string[],
  id: string,
  multiple: boolean,
): string[] {
  const on = selected.includes(id);
  if (!multiple) return on ? [] : [id];
  return on ? selected.filter((item) => item !== id) : [...selected, id];
}

export function removePickerSelection(selected: readonly string[], id: string): string[] {
  return selected.filter((item) => item !== id);
}

function groupKey(item: PickerItem): string {
  return item.group?.trim() ?? "";
}

function orderByGroup(items: readonly PickerItem[]): PickerItem[] {
  const groups = new Map<string, PickerItem[]>();
  for (const item of items) {
    const key = groupKey(item);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.values()].flat();
}

export function distinctDestinationNames(items: readonly PickerItem[]): string[] {
  const names: string[] = [];
  for (const item of items) {
    const name = groupKey(item);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export function pickerWindow(
  items: readonly PickerItem[],
  visibleCount: number,
): { rows: PickerRow[]; hidden: number } {
  const ordered = orderByGroup(items);
  const cap = Math.max(0, visibleCount);
  const visible = ordered.slice(0, cap);
  const showHeadings = distinctDestinationNames(items).length > 1;
  const rows: PickerRow[] = [];
  let previous = "\u0000";
  for (const item of visible) {
    const label = groupKey(item);
    if (showHeadings && label && label !== previous) {
      rows.push({ kind: "heading", key: `heading:${label}`, label });
      previous = label;
    }
    rows.push({ kind: "item", item });
  }
  return { rows, hidden: Math.max(0, ordered.length - visible.length) };
}

export function villaPickerItems(
  villas: readonly { id: string; name: string; destinationName?: string | null }[],
  fallbackDestination: string,
): PickerItem[] {
  return villas.map((villa) => ({
    id: villa.id,
    name: villa.name,
    detail: villa.id,
    group: villa.destinationName?.trim() || fallbackDestination,
  }));
}

export function accountPickerItems(
  accounts: readonly { name: string; email: string }[],
): PickerItem[] {
  return accounts.map((account) => ({
    id: account.email,
    name: account.name,
    detail: account.email,
  }));
}

import { useState } from "react";
import {
  PICKER_PAGE_SIZE,
  filterPickerItems,
  isExplicitMiss,
  pickerWindow,
  removePickerSelection,
  togglePickerSelection,
  type PickerItem,
} from "../lib/search-select.ts";

export function SearchSelect({
  label,
  items,
  selectedIds,
  onChange,
  multiple = true,
  placeholder = "Tìm theo tên hoặc mã",
  query,
  onQueryChange,
}: {
  label: string;
  items: readonly PickerItem[];
  selectedIds: readonly string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  query?: string;
  onQueryChange?: (query: string) => void;
}) {
  const [innerQuery, setInnerQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PICKER_PAGE_SIZE);
  const text = query ?? innerQuery;
  const setText = onQueryChange ?? setInnerQuery;
  const matches = filterPickerItems(items, text);
  const { rows, hidden } = pickerWindow(matches, visibleCount);
  const selected = selectedIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is PickerItem => Boolean(item));
  const missed = isExplicitMiss(text, matches.length);

  return (
    <fieldset className="block text-sm">
      <legend>{label}</legend>
      {selected.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep"
                aria-label={`Bỏ ${item.name}`}
                onClick={() => onChange(removePickerSelection(selectedIds, item.id))}
              >
                {item.name}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setVisibleCount(PICKER_PAGE_SIZE);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl bg-cream px-3"
        autoComplete="off"
      />
      <div data-picker-list className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-cream p-2">
        {missed ? (
          <p className="px-1 py-2 text-sm text-muted" role="status">
            Không tìm thấy
          </p>
        ) : (
          <ul>
            {rows.map((row) =>
              row.kind === "heading" ? (
                <li
                  key={row.key}
                  className="px-1 pt-2 pb-1 text-xs font-semibold tracking-wider text-muted uppercase"
                >
                  {row.label}
                </li>
              ) : (
                <li key={row.item.id}>
                  <label className="flex items-center gap-2 px-1 py-1.5">
                    <input
                      type="checkbox"
                      className="size-4 accent-lotus"
                      checked={selectedIds.includes(row.item.id)}
                      onChange={() =>
                        onChange(togglePickerSelection(selectedIds, row.item.id, multiple))
                      }
                    />
                    <span>
                      {row.item.name}
                      <span className="text-muted"> · {row.item.detail ?? row.item.id}</span>
                    </span>
                  </label>
                </li>
              ),
            )}
          </ul>
        )}
        {hidden > 0 ? (
          <button
            type="button"
            className="mt-1 px-1 py-1.5 text-sm font-medium text-lotus"
            onClick={() => setVisibleCount((count) => count + PICKER_PAGE_SIZE)}
          >
            Xem thêm
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}

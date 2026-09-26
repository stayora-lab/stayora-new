import type { ReactNode } from "react";
import {
  ACCOUNT_LOOKUP_FOUND_NOTE,
  ACCOUNT_LOOKUP_MISS,
  ACCOUNT_LOOKUP_TITLE,
  ACCOUNT_PENDING_ROLE,
  accountSearchNotice,
  type AccountSearchPhase,
} from "../lib/account-lookup.ts";

export type AccountFieldHit = {
  name: string;
  email: string;
};

/** Live database suggestions. Not the fictional roster. */
export function AccountField({
  query,
  onQueryChange,
  onPick,
  onSubmitQuery,
  phase,
  hits,
  selected,
  onClear,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onPick: (hit: AccountFieldHit) => void;
  onSubmitQuery: (value: string) => void;
  phase: AccountSearchPhase;
  hits: readonly AccountFieldHit[];
  selected: AccountFieldHit | null;
  onClear: () => void;
}) {
  const notice = accountSearchNotice(phase);
  const visible = phase === "ready" ? hits.filter((hit) => hit.email !== selected?.email) : [];

  return (
    <fieldset data-account-search className="block text-sm">
      <legend>Tài khoản</legend>
      {selected ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          <li>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-lotus-soft px-2.5 py-1 text-xs font-medium text-lotus-deep"
              aria-label={`Bỏ ${selected.name}`}
              onClick={onClear}
            >
              {selected.name}
              <span aria-hidden="true">×</span>
            </button>
          </li>
        </ul>
      ) : null}
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          onSubmitQuery(query);
        }}
        placeholder="Tìm theo tên hoặc email"
        className="mt-2 h-11 w-full rounded-xl bg-cream px-3"
        autoComplete="off"
      />
      {notice || visible.length > 0 ? (
        <div data-picker-list className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-cream p-2">
          {notice ? (
            <p className="px-1 py-2 text-sm text-ink-soft" role="status" data-account-notice={phase}>
              {notice}
            </p>
          ) : (
            <ul>
              {visible.map((hit) => (
                <li key={hit.email}>
                  <button
                    type="button"
                    data-account-hit={hit.email}
                    className="flex w-full items-center gap-2 px-1 py-1.5 text-left"
                    onClick={() => onPick(hit)}
                  >
                    <span>
                      {hit.name}
                      <span className="text-muted"> · {hit.email}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </fieldset>
  );
}

/** Database lookup result. Not the suggestion list. */
export function AccountLookupResult({
  status,
  name,
  email,
  pending = false,
  children,
}: {
  status: "found" | "missing";
  name?: string;
  email?: string;
  pending?: boolean;
  children?: ReactNode;
}) {
  if (status === "missing") {
    return (
      <aside data-lookup-result="missing" className="rounded-2xl bg-ink px-4 py-3 text-cream">
        <p className="text-xs font-semibold tracking-wider text-sand uppercase">{ACCOUNT_LOOKUP_TITLE}</p>
        <p className="mt-1 text-sm">{ACCOUNT_LOOKUP_MISS}</p>
        {email ? <p className="mt-1 text-sm text-sand">{email}</p> : null}
      </aside>
    );
  }

  return (
    <section data-lookup-result="found" className="rounded-2xl border-2 border-moss bg-paper p-4">
      <p className="text-xs font-semibold tracking-wider text-moss uppercase">{ACCOUNT_LOOKUP_TITLE}</p>
      <p className="mt-1 text-sm text-ink">{ACCOUNT_LOOKUP_FOUND_NOTE}</p>
      {name ? <p className="mt-3 font-medium">{name}</p> : null}
      {email ? <p className="text-sm text-muted">{email}</p> : null}
      {pending ? <p className="mt-3 text-sm text-ink-soft">{ACCOUNT_PENDING_ROLE}</p> : null}
      {children}
    </section>
  );
}

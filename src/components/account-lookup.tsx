import type { ReactNode } from "react";
import {
  ACCOUNT_LOOKUP_FOUND_NOTE,
  ACCOUNT_LOOKUP_MISS,
  ACCOUNT_LOOKUP_TITLE,
  ACCOUNT_PENDING_ROLE,
} from "../lib/account-lookup.ts";

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

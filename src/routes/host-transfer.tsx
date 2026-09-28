import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountField } from "@/components/account-lookup";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_SEARCH_DEBOUNCE_MS,
  accountSearchPhase,
  accountSearchQuery,
  type AccountSearchRemote,
} from "@/lib/account-lookup";
import {
  fetchTransferDesk,
  searchTransferRecipients,
  submitAcceptDesignation,
  submitCancelDesignation,
  submitCohostInvite,
  submitCohostRemove,
  submitDeclineDesignation,
  submitDesignation,
} from "@/lib/hosting-transfer-api";
import {
  cohostRemovalMatters,
  type DeskCohost,
  type DeskUnit,
  type IncomingDesignation,
} from "@/lib/hosting-transfer-model";
import { useBookingStore } from "@/lib/store";
import { getVilla } from "@/lib/villas";

export const Route = createFileRoute("/host-transfer")({
  component: TransferPage,
});

type Person = { id: string | null; name: string; email: string };

function TransferPage() {
  const identity = useBookingStore((state) => state.identity);
  const sessionReady = useBookingStore((state) => state.sessionReady);
  const world = useBookingStore((state) => state.world);
  const refreshIdentity = useBookingStore((state) => state.refreshIdentity);
  const [desk, setDesk] = useState<{ primaryUnits: DeskUnit[]; incoming: IncomingDesignation[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const next = await fetchTransferDesk();
    setDesk(next);
  }

  useEffect(() => {
    if (!sessionReady || !identity) return;
    let cancelled = false;
    void fetchTransferDesk()
      .then((next) => {
        if (!cancelled) setDesk(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không mở được chuyển giao");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionReady, identity?.id]);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
      await load();
      await refreshIdentity();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thực hiện được");
      await load().catch(() => undefined);
    }
  }

  const today = world.now.slice(0, 10);

  return (
    <main lang="vi" className="mx-auto max-w-lg px-4 py-8" data-transfer-desk>
      <p className="text-xs font-semibold tracking-wider text-lotus uppercase">Chủ nhà chính</p>
      <h1 className="mt-1 font-serif text-title">Chuyển giao và co-host</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Đề cử chưa làm đổi chủ nhà. Chỉ người được chọn bấm chấp nhận thì quyền mới chuyển. Co-host không mời hoặc chuyển giao được.
      </p>
      {error ? <p className="mt-4 text-sm text-lotus-deep">{error}</p> : null}
      {!sessionReady || (identity && desk === null && !error) ? (
        <p className="mt-6 text-sm text-muted">Đang mở dữ liệu…</p>
      ) : !identity ? (
        <p className="mt-6 text-sm">
          <Link to="/login" className="font-medium text-ink">
            Đăng nhập để xem chuyển giao
          </Link>
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {desk?.incoming.map((item) => (
            <IncomingCard
              key={item.id}
              item={item}
              matters={cohostRemovalMatters({
                unitId: item.unitId,
                today,
                requests: world.requests,
                stays: world.stays,
              })}
              onAccept={(removeCohostIds) =>
                void run(() => submitAcceptDesignation({ data: { designationId: item.id, removeCohostIds } }))
              }
              onDecline={() => void run(() => submitDeclineDesignation({ data: { designationId: item.id } }))}
            />
          ))}
          {desk && desk.primaryUnits.length === 0 && desk.incoming.length === 0 ? (
            <p className="rounded-2xl bg-paper px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              Không có villa bạn đang là chủ nhà chính, và không có đề cử nào đang chờ bạn.
            </p>
          ) : null}
          {desk?.primaryUnits.map((unit) => (
            <PrimaryUnit
              key={unit.unitId}
              unit={unit}
              today={today}
              requests={world.requests}
              stays={world.stays}
              onDesignate={(person) =>
                void run(() =>
                  submitDesignation({
                    data: {
                      unitId: unit.unitId,
                      recipientIdentityId: person.id,
                      recipientEmail: person.email,
                      recipientName: person.name,
                    },
                  }),
                )
              }
              onCancel={(designationId) =>
                void run(() => submitCancelDesignation({ data: { designationId } }))
              }
              onInvite={(person) =>
                void run(() =>
                  submitCohostInvite({
                    data: {
                      unitId: unit.unitId,
                      recipientIdentityId: person.id,
                      recipientEmail: person.email,
                      recipientName: person.name,
                    },
                  }),
                )
              }
              onRemove={(cohostIdentityId) =>
                void run(() => submitCohostRemove({ data: { unitId: unit.unitId, cohostIdentityId } }))
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}

function IncomingCard({
  item,
  matters,
  onAccept,
  onDecline,
}: {
  item: IncomingDesignation;
  matters: { text: string }[];
  onAccept: (removeIds: string[]) => void;
  onDecline: () => void;
}) {
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const villa = getVilla(item.unitId);
  const title = villa?.name ?? item.unitId;
  return (
    <article data-incoming-transfer className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-medium">{title} muốn chuyển giao cho bạn</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Chấp nhận một lần. Stayora không duyệt lại. Không chọn thì mọi co-host được giữ.
      </p>
      {item.cohosts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {item.cohosts.map((cohost) => {
            const marked = removeIds.includes(cohost.identityId);
            return (
              <li key={cohost.identityId} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {cohost.name}
                    {cohost.email ? <span className="text-muted"> · {cohost.email}</span> : null}
                  </span>
                  <button
                    type="button"
                    className="font-medium text-ink underline"
                    onClick={() =>
                      setRemoveIds((current) =>
                        marked ? current.filter((id) => id !== cohost.identityId) : [...current, cohost.identityId],
                      )
                    }
                  >
                    {marked ? "Giữ lại" : "Gỡ khi nhận"}
                  </button>
                </div>
                {marked ? (
                  <div data-removal-warning className="mt-2 rounded-xl bg-cream p-3">
                    {matters.length === 0 ? (
                      <p>Không có việc đang mở trên villa này.</p>
                    ) : (
                      <ul className="space-y-1">
                        {matters.map((matter) => (
                          <li key={matter.text}>{matter.text}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-ink-soft">Cảnh báo này không chặn việc nhận villa.</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Villa này chưa có co-host.</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" data-accept-transfer onClick={() => onAccept(removeIds)}>
          Chấp nhận
        </Button>
        <Button type="button" variant="outline" data-decline-transfer onClick={onDecline}>
          Từ chối
        </Button>
      </div>
    </article>
  );
}

function PrimaryUnit({
  unit,
  today,
  requests,
  stays,
  onDesignate,
  onCancel,
  onInvite,
  onRemove,
}: {
  unit: DeskUnit;
  today: string;
  requests: readonly { villaId: string; status: string; guestName: string; checkIn: string; checkOut: string }[];
  stays: readonly {
    villaId: string;
    status: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    assignedButlerId?: string | null;
  }[];
  onDesignate: (person: Person) => void;
  onCancel: (designationId: string) => void;
  onInvite: (person: Person) => void;
  onRemove: (identityId: string) => void;
}) {
  const villa = getVilla(unit.unitId);
  const [warningFor, setWarningFor] = useState<string | null>(null);
  const matters = cohostRemovalMatters({ unitId: unit.unitId, today, requests, stays });
  return (
    <article data-primary-unit={unit.unitId} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <h2 className="font-medium">{villa?.name ?? unit.unitId}</h2>
      {unit.pending ? (
        <div data-pending-designation className="mt-3">
          <p className="text-sm">Đang chờ {unit.pending.recipientName} chấp nhận. Bạn vẫn là chủ nhà chính.</p>
          <p className="text-sm text-muted">{unit.pending.recipientEmail}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            data-cancel-designation
            onClick={() => onCancel(unit.pending!.id)}
          >
            Hủy đề cử
          </Button>
        </div>
      ) : (
        <PersonForm
          legend="Người kế nhiệm"
          action="Đề cử người kế nhiệm"
          marker="data-designate-form"
          onSubmit={onDesignate}
        />
      )}
      <h3 className="mt-6 text-sm font-medium">Co-host</h3>
      {unit.cohosts.length === 0 ? <p className="mt-2 text-sm text-muted">Chưa có co-host.</p> : null}
      <ul className="mt-2 space-y-3">
        {unit.cohosts.map((cohost) => (
          <CohostRow
            key={cohost.identityId}
            cohost={cohost}
            open={warningFor === cohost.identityId}
            matters={matters}
            onOpen={() => setWarningFor(cohost.identityId)}
            onRemove={() => onRemove(cohost.identityId)}
          />
        ))}
      </ul>
      <PersonForm legend="Mời co-host" action="Mời co-host" marker="data-cohost-invite" onSubmit={onInvite} />
    </article>
  );
}

function CohostRow({
  cohost,
  open,
  matters,
  onOpen,
  onRemove,
}: {
  cohost: DeskCohost;
  open: boolean;
  matters: { kind: string; text: string }[];
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="text-sm">
      <div className="flex items-center justify-between gap-2">
        <span>
          {cohost.name}
          {cohost.email ? <span className="text-muted"> · {cohost.email}</span> : null}
        </span>
        <button type="button" className="font-medium underline" onClick={onOpen}>
          Gỡ
        </button>
      </div>
      {open ? (
        <div data-removal-warning className="mt-2 rounded-xl bg-cream p-3">
          {matters.length === 0 ? (
            <p>Không có việc đang mở trên villa này.</p>
          ) : (
            <ul className="space-y-1">
              {matters.map((matter) => (
                <li key={matter.text}>{matter.text}</li>
              ))}
            </ul>
          )}
          <Button type="button" className="mt-3" data-remove-cohost onClick={onRemove}>
            Vẫn gỡ
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function PersonForm({
  legend,
  action,
  marker,
  onSubmit,
}: {
  legend: string;
  action: string;
  marker: "data-designate-form" | "data-cohost-invite";
  onSubmit: (person: Person) => void;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<AccountSearchRemote | null>(null);
  const [hits, setHits] = useState<{ id: string; name: string; email: string }[]>([]);
  const [picked, setPicked] = useState<{ id: string; name: string; email: string } | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const decision = accountSearchQuery(query);
    if (!decision.ready) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchTransferRecipients({ data: { query: decision.needle } })
        .then((result) => {
          if (cancelled) return;
          setHits(result.accounts);
          setRemote({ settledQuery: decision.needle, accounts: result.accounts });
        })
        .catch(() => {
          if (!cancelled) setRemote({ settledQuery: decision.needle, accounts: [], failed: true });
        });
    }, ACCOUNT_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const phase = accountSearchPhase(query, remote);
  const person = picked ?? { id: null, name, email };

  return (
    <form
      {...{ [marker]: "" }}
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!person.email.trim() || !person.name.trim()) return;
        onSubmit(person);
      }}
    >
      <AccountField
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          if (picked) setPicked(null);
        }}
        onPick={(hit) => {
          const found = hits.find((item) => item.email === hit.email);
          const next = { id: found?.id ?? "", name: hit.name, email: hit.email };
          setPicked(next.id ? next : null);
          setEmail(hit.email);
          setName(hit.name);
          setQuery("");
        }}
        onSubmitQuery={() => undefined}
        phase={phase}
        hits={hits}
        selected={picked}
        onClear={() => setPicked(null)}
      />
      <p className="text-xs text-muted">{legend}. Chưa có tài khoản thì ghi email và tên.</p>
      <label className="block text-sm">
        Email
        <input
          value={picked?.email ?? email}
          onChange={(event) => {
            setPicked(null);
            setEmail(event.target.value);
          }}
          className="mt-1 h-11 w-full rounded-xl bg-cream px-3"
          autoComplete="off"
        />
      </label>
      <label className="block text-sm">
        Tên
        <input
          value={picked?.name ?? name}
          onChange={(event) => {
            setPicked(null);
            setName(event.target.value);
          }}
          className="mt-1 h-11 w-full rounded-xl bg-cream px-3"
          autoComplete="off"
        />
      </label>
      <Button type="submit">{action}</Button>
    </form>
  );
}

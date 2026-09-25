import { format, parseISO } from "date-fns";
import { cardDate, nextCardAction, type BoardLane, type NextCardAction } from "../lib/butler-card.ts";
import type { Stay } from "../lib/domain/types.ts";
import { visibleGuestName } from "../lib/privacy.ts";
import type { RoleSession } from "../lib/role.ts";
import { getVilla } from "../lib/villas.ts";

export function ButlerStayCard({
  stay,
  role,
  lane,
  canAct,
  onOpen,
  onAction,
}: {
  stay: Stay;
  role: RoleSession;
  lane: BoardLane;
  canAct: boolean;
  onOpen: () => void;
  onAction: (actionId: NextCardAction["id"]) => void;
}) {
  const villa = getVilla(stay.villaId);
  const guest = visibleGuestName(stay, role);
  const when = cardDate(stay, lane);
  const action = canAct ? nextCardAction(stay, lane) : null;

  return (
    <article className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-border)]">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <p className="font-medium">{villa?.name ?? stay.villaId}</p>
        <p className="text-sm text-muted">{stay.villaId}</p>
        <p className="mt-2 text-sm text-ink-soft">{stay.guests} khách</p>
        <p className="text-sm text-ink-soft">
          {when.label} {format(parseISO(when.iso), "d/M/yyyy")}
        </p>
        <p className="mt-2 text-sm">
          <span className="text-muted">Khách chính · </span>
          {guest}
        </p>
      </button>
      {action ? (
        <button
          type="button"
          className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full bg-lotus px-5 text-sm font-medium text-cream"
          data-next-action={action.id}
          onClick={() => onAction(action.id)}
        >
          {action.label}
        </button>
      ) : null}
    </article>
  );
}

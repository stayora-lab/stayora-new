import { useNavigate } from "@tanstack/react-router";
import { emptyRoleHint, type WorkRole } from "@/lib/role-hint";
import { workspaceFor } from "@/lib/role";
import { useBookingStore } from "@/lib/store";
import { villas } from "@/lib/villas";

function ictDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** One line, only when this role is empty today and another role is not. */
export function OtherRoleHint({ current }: { current: WorkRole }) {
  const identity = useBookingStore((state) => state.identity);
  const grants = useBookingStore((state) => state.grants);
  const world = useBookingStore((state) => state.world);
  const selectGrant = useBookingStore((state) => state.selectGrant);
  const navigate = useNavigate();
  if (!identity) return null;
  const hints = emptyRoleHint({
    grants,
    current,
    world,
    today: ictDay(world.now),
    knownVillaIds: villas.map((villa) => villa.id),
  });
  if (!hints) return null;
  return (
    <p data-role-hint className="mt-3 text-sm text-ink">
      Vai này không có việc hôm nay. Mở{" "}
      {hints.map((item, index) => (
        <span key={item.role}>
          {index > 0 ? (index === hints.length - 1 ? " hoặc " : ", ") : null}
          <button
            type="button"
            className="font-medium text-lotus underline"
            onClick={() => {
              selectGrant(item.grantId);
              void navigate({ to: workspaceFor(item.role) });
            }}
          >
            vai {item.label}
          </button>
        </span>
      ))}
      .
    </p>
  );
}

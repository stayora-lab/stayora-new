import type { StayStatus } from "./domain/types.ts";

export { HOST_ACTIONS_BEYOND_STANDARD_SET } from "./host-capability-config.ts";

/** Follow-up actions belong on a stay that is still ahead or in house. */
export function stayOffersHostFollowUp(status: StayStatus): boolean {
  return status === "SCHEDULED" || status === "CHECKED_IN";
}

/**
 * A protective hold is sent only after the Host confirms and writes a reason.
 * Empty or unconfirmed input does not produce a note, so the domain call is not made.
 */
export function protectiveHoldNote(input: { confirmed: boolean; reason: string }): string | null {
  if (!input.confirmed) return null;
  const note = input.reason.trim();
  return note.length > 0 ? note : null;
}

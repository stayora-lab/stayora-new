import { butlerPeople, hostOwnsVilla } from "./villas.ts";
import type { RoleSession } from "./role.ts";

const HIDDEN = "Khách";

export type GuestNameRecord = {
  guestName?: string;
  villaId: string;
  origin?: string;
  saleId?: string;
};

/** Seed/external names: Host of that villa and assigned Butler only. BQL/Sale see "Khách". */
export function visibleGuestName(record: GuestNameRecord, role: RoleSession): string {
  const name = record.guestName?.trim();
  if (!name) return HIDDEN;

  if (role.persona === "ADMIN") return name;
  if (role.persona === "HOST") {
    return hostOwnsVilla(role.hostId, record.villaId) ? name : HIDDEN;
  }
  if (role.persona === "BUTLER") {
    const butler = butlerPeople.find((person) => person.id === role.butlerId);
    return butler?.villaIds?.includes(record.villaId) ? name : HIDDEN;
  }
  if (role.persona === "SALE") {
    if (record.origin === "EXTERNAL") return HIDDEN;
    if (record.saleId && record.saleId === role.saleId) return name;
    return HIDDEN;
  }
  return HIDDEN;
}

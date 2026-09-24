import type { Persona } from "./domain/types.ts";

export type DevUser = { id: string; email: string; name: string };

export type DevGrantRow = {
  id: string;
  userId: string;
  role: Persona;
  scopeRef: string | null;
  status: "active" | "revoked";
  grantedBy: string | null;
  grantedAt: string;
};

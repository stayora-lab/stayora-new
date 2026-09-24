import raw from "../../data/pilot-seed.json" with { type: "json" };
import type { BlockKind, ExternalSource, Persona } from "./domain/types.ts";

/** Destination name only — never a person, sale, butler or source. */
export const DESTINATION_NAME = "Oceanami";

export const DEV_PASSWORD = "Stayora-thu-1";

export type PilotHost = { id: string; name: string };
export type PilotSale = { id: string; name: string };
export type PilotButler = { id: string; name: string; villaIds: string[] };
export type PilotPerson = {
  id: string;
  name: string;
  email: string;
  note?: string;
};
export type PilotGrant = {
  personId: string;
  role: Persona;
  scopeRef: string | null;
  note?: string;
};
export type PilotVilla = {
  id: string;
  code?: string;
  name: string;
  hostId: string;
  ownerIds?: string[];
  relationship?: "own" | "Thuê lại";
  bedrooms: number;
  sleeps: number;
  nightlyPrice: number;
  photos: string[];
  setting?: "beachfront" | "garden" | "hillside";
  note?: string;
};
export type PilotStay = {
  villaId: string;
  checkIn?: string;
  checkOut?: string;
  checkInOffset?: number;
  nights?: number;
  guests: number;
  source: ExternalSource;
  guestName?: string;
  note?: string;
};
export type PilotBlock = {
  villaId: string;
  start?: string;
  end?: string;
  startOffset?: number;
  nights?: number;
  kind: BlockKind;
  note?: string;
};
export type PilotSeed = {
  coverage?: string[];
  people?: PilotPerson[];
  hosts: PilotHost[];
  sales: PilotSale[];
  butlers: PilotButler[];
  bql?: { id: string; name: string }[];
  grants?: PilotGrant[];
  villas: PilotVilla[];
  existingStays: PilotStay[];
  blocks: PilotBlock[];
};

const PHONE_RE = /(?:^|[^\d])(?:\+?84|0)[\s.-]*[3-9](?:[\s.-]*\d){8}(?!\d)/;
const ID_RE = /(?<!\d)\d{12}(?!\d)|(?<!\d)\d{9}(?!\d)/;

function personFields(seed: PilotSeed): { kind: string; name: string }[] {
  return [
    ...seed.hosts.map((person) => ({ kind: "host", name: person.name })),
    ...seed.sales.map((person) => ({ kind: "sale", name: person.name })),
    ...seed.butlers.map((person) => ({ kind: "butler", name: person.name })),
    ...(seed.people ?? []).map((person) => ({ kind: "person", name: person.name })),
    ...seed.existingStays.map((stay) => ({ kind: "source", name: stay.source })),
  ];
}

function identityStrings(seed: PilotSeed): string[] {
  return [
    ...seed.hosts.map((person) => person.name),
    ...seed.sales.map((person) => person.name),
    ...seed.butlers.map((person) => person.name),
    ...(seed.people ?? []).map((person) => person.name),
    ...seed.existingStays.flatMap((stay) => [stay.source, stay.guestName ?? ""]),
  ];
}

export function assertPilotSeed(seed: PilotSeed, destinationName = DESTINATION_NAME): void {
  const dest = destinationName.trim().toLowerCase();
  if (!dest) throw new Error("Destination name is required");
  for (const field of personFields(seed)) {
    if (field.name.trim().toLowerCase() === dest) {
      throw new Error(`${field.kind} name must not equal destination "${destinationName}"`);
    }
  }
  const hostIds = new Set(seed.hosts.map((person) => person.id));
  for (const villa of seed.villas) {
    if (!hostIds.has(villa.hostId)) {
      throw new Error(`Villa ${villa.id} references unknown host ${villa.hostId}`);
    }
    if (!/^t\d{2}$/i.test(villa.id) && !/^T\d{2}$/.test(villa.code ?? "")) {
      throw new Error(`Villa ${villa.id} must use test code T01…T12`);
    }
  }
  for (const value of identityStrings(seed)) {
    if (PHONE_RE.test(value)) {
      throw new Error("Seed must not contain phone numbers");
    }
    if (ID_RE.test(value)) {
      throw new Error("Seed must not contain ID numbers");
    }
  }
}

const parsed = raw as PilotSeed;
assertPilotSeed(parsed);

export const PILOT_SEED = parsed;

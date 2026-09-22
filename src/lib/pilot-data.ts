import raw from "../../data/pilot-seed.json" with { type: "json" };
import type { BlockKind, ExternalSource } from "./domain/types.ts";

export type PilotHost = { id: string; name: string };
export type PilotSale = { id: string; name: string };
export type PilotButler = { id: string; name: string; villaIds: string[] };
export type PilotVilla = {
  id: string;
  name: string;
  hostId: string;
  bedrooms: number;
  sleeps: number;
  nightlyPrice: number;
  photos: string[];
  setting?: "beachfront" | "garden" | "hillside";
};
export type PilotStay = {
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  source: ExternalSource;
  guestName?: string;
};
export type PilotBlock = {
  villaId: string;
  start: string;
  end: string;
  kind: BlockKind;
};
export type PilotSeed = {
  hosts: PilotHost[];
  sales: PilotSale[];
  butlers: PilotButler[];
  villas: PilotVilla[];
  existingStays: PilotStay[];
  blocks: PilotBlock[];
};

export const PILOT_SEED = raw as PilotSeed;

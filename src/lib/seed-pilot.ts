import { PILOT_NOW } from "./domain/config.ts";
import {
  createBlock,
  createEmptyWorld,
  recordExternalBooking,
  type World,
} from "./domain/index.ts";
import { PILOT_SEED } from "./pilot-data.ts";

const SEED_HOST = { persona: "HOST" as const };

/** Build the field-test World from data/pilot-seed.json using engine paths. */
export function seedFromPilot(): World {
  let world = createEmptyWorld(PILOT_NOW);
  world = {
    ...world,
    sales: PILOT_SEED.sales.map((person) => ({ id: person.id, name: person.name })),
    butlers: PILOT_SEED.butlers.map((person) => ({
      id: person.id,
      name: person.name,
      villaIds: person.villaIds,
    })),
  };
  for (const stay of PILOT_SEED.existingStays) {
    world = recordExternalBooking(world, {
      villaId: stay.villaId,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: stay.guests,
      source: stay.source,
      guestName: stay.guestName,
      actor: SEED_HOST,
    }).world;
  }
  for (const block of PILOT_SEED.blocks) {
    world = createBlock(world, {
      villaId: block.villaId,
      start: block.start,
      end: block.end,
      blockKind: block.kind,
      actor: SEED_HOST,
    }).world;
  }
  return world;
}

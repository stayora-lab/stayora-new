import { expireHolds, type World } from "@/lib/domain";
import { getSql } from "@/lib/db";
import { seedFromPilot } from "./seed-pilot.ts";
import { mutateWorld, type WorldSnapshot } from "./world-mutate.ts";
import { applyWorldAction, type WorldAction } from "./world-actions.ts";
import type { RoleSession } from "./role.ts";

const ROW_ID = 1;

type WorldRow = {
  id: number;
  version: number;
  data: unknown;
  updated_at: string;
};

function parseWorld(data: unknown): World {
  if (typeof data === "string") return JSON.parse(data) as World;
  return data as World;
}

async function loadRow(): Promise<(WorldSnapshot & { updatedAt: string }) | null> {
  const sql = await getSql();
  const rows = await sql.query<WorldRow>(
    "select id, version, data, updated_at from world_state where id = $1",
    [ROW_ID],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    world: parseWorld(row.data),
    version: Number(row.version),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date(row.updated_at).toISOString(),
  };
}

async function insertSeed(): Promise<WorldSnapshot & { updatedAt: string }> {
  const world = seedFromPilot();
  const sql = await getSql();
  await sql.query(
    "insert into world_state (id, version, data, updated_at) values ($1, $2, $3::jsonb, now()) on conflict (id) do nothing",
    [ROW_ID, 1, JSON.stringify(world)],
  );
  const loaded = await loadRow();
  if (loaded) return loaded;
  return { world, version: 1, updatedAt: new Date().toISOString() };
}

async function saveRow(world: World, expectedVersion: number): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ version: number }>(
    "update world_state set version = version + 1, data = $1::jsonb, updated_at = now() where id = $2 and version = $3 returning version",
    [JSON.stringify(world), ROW_ID, expectedVersion],
  );
  return rows.length > 0;
}

export async function readWorld(): Promise<{ world: World; version: number; updatedAt: string }> {
  const current = (await loadRow()) ?? (await insertSeed());
  const expired = expireHolds(current.world);
  if (expired === current.world) {
    return { world: current.world, version: current.version, updatedAt: current.updatedAt };
  }
  const saved = await saveRow(expired, current.version);
  if (saved) {
    return {
      world: expired,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };
  }
  const latest = (await loadRow()) ?? current;
  return { world: latest.world, version: latest.version, updatedAt: latest.updatedAt };
}

export async function runWorldAction(action: WorldAction, role: RoleSession) {
  const io = {
    load: async () => {
      const snap = await readWorld();
      return { world: snap.world, version: snap.version };
    },
    save: saveRow,
  };
  const result = await mutateWorld(io, (world) => applyWorldAction(world, action, role));
  const latest = await loadRow();
  return {
    world: result.world,
    version: result.version,
    updatedAt: latest?.updatedAt ?? new Date().toISOString(),
    requestId: result.requestId,
  };
}

export async function resetWorld(role: RoleSession) {
  return runWorldAction({ type: "RESET" }, role);
}

import { DomainError, type World } from "./domain/engine.ts";

export type WorldSnapshot = { world: World; version: number };

export type WorldIo = {
  load: () => Promise<WorldSnapshot>;
  save: (world: World, expectedVersion: number) => Promise<boolean>;
};

/**
 * Load → run mutator → write with optimistic concurrency.
 * If the version changed, reload and rerun once; otherwise CONCURRENT_CHANGE.
 */
export async function mutateWorld<T extends { world: World }>(
  io: WorldIo,
  mutator: (world: World) => T,
): Promise<T & { version: number }> {
  const first = await io.load();
  const applied = mutator(first.world);
  if (await io.save(applied.world, first.version)) {
    return { ...applied, version: first.version + 1 };
  }
  const second = await io.load();
  const retried = mutator(second.world);
  if (await io.save(retried.world, second.version)) {
    return { ...retried, version: second.version + 1 };
  }
  throw new DomainError("CONCURRENT_CHANGE", "Có người vừa thay đổi — thử lại");
}

import { getChunks } from '#shared/utils';

const MAX_BATCH_SIZE = 500;

interface PendingRequest<T> {
  resolve: (instance: T | null) => void;
  reject: (reason: unknown) => void;
}

export function createBatchLoader<T extends { uuid: string }>(
  fetchMany: (uuids: string[]) => Promise<T[]>,
): (uuid: string) => Promise<T | null> {
  let pending = new Map<string, PendingRequest<T>[]>();
  let scheduled = false;

  const loadChunk = async (
    uuids: string[],
    batch: Map<string, PendingRequest<T>[]>,
  ) => {
    try {
      const instances = new Map(
        (await fetchMany(uuids)).map((instance) => [instance.uuid, instance]),
      );

      for (const uuid of uuids) {
        for (const request of batch.get(uuid) ?? []) {
          request.resolve(instances.get(uuid) ?? null);
        }
      }
    } catch (err) {
      for (const uuid of uuids) {
        for (const request of batch.get(uuid) ?? []) request.reject(err);
      }
    }
  };

  const flush = () => {
    const batch = pending;
    const uuids = [...batch.keys()];

    pending = new Map();
    scheduled = false;

    for (const chunk of getChunks(uuids, MAX_BATCH_SIZE)) {
      loadChunk(chunk, batch);
    }
  };

  return (uuid) =>
    new Promise((resolve, reject) => {
      pending.getOrInsertComputed(uuid, () => []).push({ resolve, reject });

      if (scheduled) return;

      scheduled = true;
      queueMicrotask(flush);
    });
}

export function createQueryByIds<T>(
  queryById: (uuid: string) => Promise<T | null>,
): (uuids: string[]) => Promise<T[]> {
  return async (uuids) => {
    const instances = await Promise.all(uuids.map((uuid) => queryById(uuid)));

    return instances.filter((instance) => instance !== null);
  };
}

import { openDB } from "idb";
import { DB_NAME, DB_VERSION, STORES } from "./idb-config";

type QueuedEvent = {
  idempotencyKey: string;
  payload: unknown;
  createdAt: string;
};

const getDb = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          db.createObjectStore(STORES.QUEUE, { keyPath: "idempotencyKey" });
        }
      }
      // employee-cache handles version 2 stores via STORES.EMPLOYEES and STORES.META
      // This file focuses on STORES.QUEUE but respects the shared version
    },
  });

export const enqueueEvent = async (payload: unknown, idempotencyKey: string) => {
  const db = await getDb();
  const record: QueuedEvent = {
    idempotencyKey,
    payload,
    createdAt: new Date().toISOString(),
  };
  await db.put(STORES.QUEUE, record);
};

export const listQueuedEvents = async () => {
  const db = await getDb();
  return db.getAll(STORES.QUEUE);
};

export const removeQueuedEvent = async (idempotencyKey: string) => {
  const db = await getDb();
  await db.delete(STORES.QUEUE, idempotencyKey);
};

export const countQueuedEvents = async () => {
  const db = await getDb();
  return db.count(STORES.QUEUE);
};

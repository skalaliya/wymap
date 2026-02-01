import { openDB } from "idb";

const DB_NAME = "wymap-kiosk";
const STORE_NAME = "event-queue";

type QueuedEvent = {
  idempotencyKey: string;
  payload: unknown;
  createdAt: string;
};

const getDb = () =>
  openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "idempotencyKey" });
      }
    },
  });

export const enqueueEvent = async (payload: unknown, idempotencyKey: string) => {
  const db = await getDb();
  const record: QueuedEvent = {
    idempotencyKey,
    payload,
    createdAt: new Date().toISOString(),
  };
  await db.put(STORE_NAME, record);
};

export const listQueuedEvents = async () => {
  const db = await getDb();
  return db.getAll(STORE_NAME);
};

export const removeQueuedEvent = async (idempotencyKey: string) => {
  const db = await getDb();
  await db.delete(STORE_NAME, idempotencyKey);
};

export const countQueuedEvents = async () => {
  const db = await getDb();
  return db.count(STORE_NAME);
};

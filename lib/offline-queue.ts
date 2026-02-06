import { openDB } from "idb";
import { DB_NAME, DB_VERSION, STORES, onUpgrade } from "./idb-config";

export type QueuedEvent = {
  idempotencyKey: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
};

const getDb = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade: onUpgrade,
  });

export const enqueueEvent = async (
  payload: Record<string, unknown>,
  idempotencyKey: string,
) => {
  const db = await getDb();
  const record: QueuedEvent = {
    idempotencyKey,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
  };
  await db.put(STORES.QUEUE, record);
};

export const listQueuedEvents = async (): Promise<QueuedEvent[]> => {
  const db = await getDb();
  const records = (await db.getAll(STORES.QUEUE)) as QueuedEvent[];
  records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return records;
};

export const removeQueuedEvent = async (idempotencyKey: string) => {
  const db = await getDb();
  await db.delete(STORES.QUEUE, idempotencyKey);
};

export const markQueuedEventAttempt = async (
  idempotencyKey: string,
  lastError: string,
) => {
  const db = await getDb();
  const existing = (await db.get(STORES.QUEUE, idempotencyKey)) as
    | QueuedEvent
    | undefined;

  if (!existing) {
    return;
  }

  const updated: QueuedEvent = {
    ...existing,
    attempts: existing.attempts + 1,
    lastAttemptAt: new Date().toISOString(),
    lastError,
  };

  await db.put(STORES.QUEUE, updated);
};

export const countQueuedEvents = async () => {
  const db = await getDb();
  return db.count(STORES.QUEUE);
};

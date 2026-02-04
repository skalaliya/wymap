import type { IDBPDatabase } from "idb";

export const DB_NAME = "wymap-kiosk";
export const DB_VERSION = 2;

export const STORES = {
    EMPLOYEES: "employees",
    META: "meta",
    QUEUE: "event-queue",
} as const;

export const onUpgrade = (db: IDBPDatabase<unknown>, oldVersion: number) => {
    if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
            db.createObjectStore(STORES.QUEUE, { keyPath: "idempotencyKey" });
        }
    }
    if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORES.EMPLOYEES)) {
            db.createObjectStore(STORES.EMPLOYEES, { keyPath: "badgeId" });
        }
        if (!db.objectStoreNames.contains(STORES.META)) {
            db.createObjectStore(STORES.META, { keyPath: "id" });
        }
    }
};

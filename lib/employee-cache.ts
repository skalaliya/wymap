import { openDB } from "idb";
import { DB_NAME, DB_VERSION, STORES, onUpgrade } from "./idb-config";

type CachedEmployee = {
    badgeId: string;
    employeeId: string;
    displayName: string;
};

type CacheMeta = {
    id: string;
    version: string;
    updatedAt: string;
    count: number;
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache for instant lookups
const memoryCache = new Map<string, CachedEmployee>();
let isMemoryReady = false;

const getDb = () =>
    openDB(DB_NAME, DB_VERSION, {
        upgrade: onUpgrade,
    });

export const setMemoryCache = (employees: CachedEmployee[]) => {
    memoryCache.clear();
    for (const emp of employees) {
        memoryCache.set(emp.badgeId, emp);
    }
    isMemoryReady = true;
};

export const getFromMemoryCache = (badgeId: string): CachedEmployee | null => {
    return memoryCache.get(badgeId) ?? null;
};

export const isMemoryCacheReady = () => isMemoryReady;

export const getCacheVersion = async (): Promise<string | null> => {
    try {
        const db = await getDb();
        const meta = await db.get(STORES.META, "employees") as CacheMeta | undefined;
        return meta?.version ?? null;
    } catch {
        // IndexedDB may not be available in some environments
        return null;
    }
};

export const isCacheValid = async (): Promise<boolean> => {
    try {
        const db = await getDb();
        const meta = await db.get(STORES.META, "employees") as CacheMeta | undefined;
        if (!meta) return false;

        const age = Date.now() - new Date(meta.updatedAt).getTime();
        return age < CACHE_TTL_MS;
    } catch {
        return false;
    }
};

export const getAllCachedEmployees = async (): Promise<CachedEmployee[]> => {
    try {
        const db = await getDb();
        return await db.getAll(STORES.EMPLOYEES);
    } catch {
        return [];
    }
};

export const cacheEmployees = async (
    employees: CachedEmployee[],
    version: string,
): Promise<void> => {
    // Always update memory cache first
    setMemoryCache(employees);

    try {
        const db = await getDb();
        const tx = db.transaction([STORES.EMPLOYEES, STORES.META], "readwrite");

        // Clear existing employees
        await tx.objectStore(STORES.EMPLOYEES).clear();

        // Add new employees
        for (const emp of employees) {
            await tx.objectStore(STORES.EMPLOYEES).put(emp);
        }

        // Update meta
        const meta: CacheMeta = {
            id: "employees",
            version,
            updatedAt: new Date().toISOString(),
            count: employees.length,
        };
        await tx.objectStore(STORES.META).put(meta);

        await tx.done;
    } catch {
        // Ignore persistence errors - memory cache is still valid for this session
    }
};

export const lookupEmployeeByBadge = async (
    badgeId: string,
): Promise<CachedEmployee | null> => {
    // 1. Try memory cache first (instant)
    const memoryResult = getFromMemoryCache(badgeId);
    if (memoryResult) return memoryResult;

    // 2. Fallback to IndexedDB (async)
    try {
        const db = await getDb();
        const employee = await db.get(STORES.EMPLOYEES, badgeId) as CachedEmployee | undefined;
        return employee ?? null;
    } catch {
        // IndexedDB may not be available
        return null;
    }
};

export const getCacheStats = async (): Promise<{ count: number; version: string | null; valid: boolean; memoryReady: boolean }> => {
    const db = await getDb();
    const meta = await db.get(STORES.META, "employees") as CacheMeta | undefined;
    const valid = await isCacheValid();
    return {
        count: meta?.count ?? 0,
        version: meta?.version ?? null,
        valid,
        memoryReady: isMemoryReady,
    };
};

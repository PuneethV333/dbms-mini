interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const globalForCache = globalThis as unknown as {
  bsafeCache?: Map<string, CacheEntry>;
};

const store = (globalForCache.bsafeCache ??= new Map<string, CacheEntry>());

export async function cacheGet<T>(key: string): Promise<T | null> {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  store.delete(key);
}

export async function cacheDelPrefix(prefix: string): Promise<void> {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

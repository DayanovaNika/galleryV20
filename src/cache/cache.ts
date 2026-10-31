
const CACHE_PREFIX = "pk_cache:v1:";
const INDEX_KEY = `${CACHE_PREFIX}__index__`;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class Cache {
  #storage: Storage;

  constructor(storage: Storage = sessionStorage) {
    this.#storage = storage;
  }

  static buildKey(parts: Record<string, unknown>): string {
    const sorted = Object.keys(parts)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = parts[key];
        return acc;
      }, {});

    return CACHE_PREFIX + JSON.stringify(sorted);
  }

  get<T>(key: string): T | null {
    const raw = this.#storage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      const entry: CacheEntry<T> = JSON.parse(raw);

      if (Date.now() > entry.expiresAt) {
        this.#storage.removeItem(key);
        this.#removeFromIndex(key);
        return null;
      }

      return entry.data;
    } catch {
      this.#storage.removeItem(key);
      return null;
    }
  }

  set<T>(key: string, data: T, ttlMs: number) {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
    };
    const serialized = JSON.stringify(entry);

    try {
      this.#storage.setItem(key, serialized);
      this.#addToIndex(key);
    } catch {
      this.#evictOldest();

      try {
        this.#storage.setItem(key, serialized);
        this.#addToIndex(key);
      } catch {
      }
    }
  }

  #getIndex(): string[] {
    const raw = this.#storage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  #addToIndex(key: string) {
    const index = this.#getIndex();
    if (!index.includes(key)) {
      index.push(key);
      this.#storage.setItem(INDEX_KEY, JSON.stringify(index));
    }
  }

  #removeFromIndex(key: string) {
    const index = this.#getIndex().filter((item) => item !== key);
    this.#storage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  #evictOldest(count = 5) {
    const index = this.#getIndex();
    const toRemove = index.slice(0, count);
    toRemove.forEach((key) => this.#storage.removeItem(key));
    this.#storage.setItem(INDEX_KEY, JSON.stringify(index.slice(count)));
  }
}

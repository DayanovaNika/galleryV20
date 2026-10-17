// Версия в префиксе — чтобы при изменении формата ответов API
// можно было одним изменением константы "обнулить" весь старый кэш:
// старые записи просто перестанут матчиться новым ключам.
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

  // Стабильная сериализация параметров запроса в ключ: сортируем
  // ключи объекта, чтобы {a:1,b:2} и {b:2,a:1} давали один и тот же
  // ключ кэша (иначе один и тот же запрос с разным порядком полей
  // считался бы разными записями)
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
      // битая запись (например, после смены формата) — считаем, что кэша нет
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
      // переполнение хранилища (QuotaExceededError) — чистим
      // несколько самых старых записей и пробуем ещё раз
      this.#evictOldest();

      try {
        this.#storage.setItem(key, serialized);
        this.#addToIndex(key);
      } catch {
        // снова не вышло — просто не кэшируем этот ответ,
        // на работу приложения это не влияет
      }
    }
  }

  // Индекс ключей в порядке добавления — нужен, чтобы при переполнении
  // быстро найти самые старые записи, не перебирая весь storage
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

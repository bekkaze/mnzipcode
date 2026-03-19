interface CacheEntry<T> {
  data: T
  expires: number
}

export interface Cache<T> {
  get(key: string): T | undefined
  set(key: string, value: T, ttl: number): void
  clear(): void
}

export function createCache<T>(): Cache<T> {
  const store = new Map<string, CacheEntry<T>>()

  return {
    get(key: string): T | undefined {
      const entry = store.get(key)
      if (!entry) return undefined
      if (Date.now() > entry.expires) {
        store.delete(key)
        return undefined
      }
      return entry.data
    },

    set(key: string, value: T, ttl: number): void {
      store.set(key, { data: value, expires: Date.now() + ttl })
    },

    clear(): void {
      store.clear()
    },
  }
}

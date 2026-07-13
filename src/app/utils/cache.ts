interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

export class AppCache {
  static set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    if (typeof localStorage === 'undefined') return;
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
  }

  static get<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > DEFAULT_TTL) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      return entry.data;
    } catch {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
  }

  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  static invalidate(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(`cache:${key}`);
  }

  static invalidatePrefix(prefix: string): void {
    if (typeof localStorage === 'undefined') return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`cache:${prefix}`));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

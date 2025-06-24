import type { CacheStore, CacheKey, CacheEntry } from './types';
import type { RouteResult } from '../providers/osrm';

export class MemoryCache implements CacheStore {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 3600000; // 1 hour in milliseconds

  private generateKey(key: CacheKey): string {
    return `${key.provider}:${key.origin.lat},${key.origin.lng}:${key.dest.lat},${key.dest.lng}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  async get(key: CacheKey): Promise<RouteResult | null> {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.result;
  }

  async set(key: CacheKey, result: RouteResult, ttl?: number): Promise<void> {
    const cacheKey = this.generateKey(key);
    const entry: CacheEntry = {
      key,
      result,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(cacheKey, entry);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async isAvailable(): Promise<boolean> {
    return true; // Memory cache is always available
  }

  // Helper method for testing
  getSize(): number {
    return this.cache.size;
  }
}

export const memoryCache = new MemoryCache(); 
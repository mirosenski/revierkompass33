import type { CacheStore, CacheKey, CacheEntry } from './types';
import type { RouteResult } from '../providers/osrm';

const DB_NAME = 'routing-cache';
const STORE_NAME = 'routes';
const DB_VERSION = 1;

export class IDBCache implements CacheStore {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private generateKey(key: CacheKey): string {
    return `${key.provider}:${key.origin.lat},${key.origin.lng}:${key.dest.lat},${key.dest.lng}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  async get(key: CacheKey): Promise<RouteResult | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const cacheKey = this.generateKey(key);

      return new Promise((resolve, reject) => {
        const request = store.get(cacheKey);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const entry: CacheEntry | undefined = request.result;
          if (!entry || this.isExpired(entry)) {
            resolve(null);
          } else {
            resolve(entry.result);
          }
        };
      });
    } catch (error) {
      console.warn('IDB cache get failed:', error);
      return null;
    }
  }

  async set(key: CacheKey, result: RouteResult, ttl?: number): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const cacheKey = this.generateKey(key);

      const entry: CacheEntry = {
        key,
        result,
        timestamp: Date.now(),
        ttl: ttl || 3600000, // 1 hour default
      };

      return new Promise((resolve, reject) => {
        const request = store.put({ id: cacheKey, ...entry });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IDB cache set failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IDB cache clear failed:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getDB();
      return true;
    } catch {
      return false;
    }
  }
}

export const idbCache = new IDBCache(); 
import type { LatLng, RouteResult } from '../providers/osrm';

export interface CacheKey {
  origin: LatLng;
  dest: LatLng;
  provider: string;
}

export interface CacheEntry {
  key: CacheKey;
  result: RouteResult;
  timestamp: number;
  ttl: number;
}

export interface CacheStore {
  get(key: CacheKey): Promise<RouteResult | null>;
  set(key: CacheKey, result: RouteResult, ttl?: number): Promise<void>;
  clear(): Promise<void>;
  isAvailable(): Promise<boolean>;
} 
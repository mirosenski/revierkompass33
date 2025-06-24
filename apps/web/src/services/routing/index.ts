import type { LatLng, RouteResult } from './providers/osrm';
import { getRouteOSRM } from './providers/osrm';
import { getRouteValhalla } from './providers/valhalla';
import { getHaversineFallback } from './providers/haversine';
import { memoryCache } from './cache/memoryCache';
import { idbCache } from './cache/idbCache';
import type { CacheKey } from './cache/types';

const providers = [getRouteOSRM, getRouteValhalla, getHaversineFallback];
const stores = [memoryCache, idbCache];

async function getCachedRoute(key: CacheKey): Promise<RouteResult | null> {
  for (const store of stores) {
    if (await store.isAvailable()) {
      const cached = await store.get(key);
      if (cached) {
        return cached;
      }
    }
  }
  return null;
}

async function cacheRoute(key: CacheKey, result: RouteResult): Promise<void> {
  for (const store of stores) {
    if (await store.isAvailable()) {
      try {
        await store.set(key, result);
      } catch (error) {
        console.warn(`Failed to cache route in ${store.constructor.name}:`, error);
      }
    }
  }
}

export async function getOptimalRoute(origin: LatLng, dest: LatLng): Promise<RouteResult> {
  // Try cache first
  const cacheKey: CacheKey = { origin, dest, provider: 'any' };
  const cached = await getCachedRoute(cacheKey);
  if (cached) {
    return cached;
  }

  // Try providers in order
  for (const provider of providers) {
    try {
      const result = await provider(origin, dest);
      
      // Cache the successful result
      await cacheRoute(cacheKey, result);
      
      return result;
    } catch (error) {
      console.warn(`Provider ${provider.name} failed:`, error);
      // Continue to next provider
    }
  }

  // If all providers fail, this should not happen as Haversine is the last fallback
  throw new Error('All routing providers failed');
}

export async function clearCache(): Promise<void> {
  for (const store of stores) {
    if (await store.isAvailable()) {
      try {
        await store.clear();
      } catch (error) {
        console.warn(`Failed to clear cache in ${store.constructor.name}:`, error);
      }
    }
  }
}

// Export types for external use
export type { LatLng, RouteResult } from './providers/osrm';
export type { CacheKey } from './cache/types'; 
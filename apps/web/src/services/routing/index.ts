import type { LatLng, RouteResult } from './providers/osrm';
import { getRouteOSRM } from './providers/osrm';
import { getRouteValhalla } from './providers/valhalla';
import { getHaversineFallback } from './providers/haversine';
import { memoryCache } from './cache/memoryCache';
import { idbCache } from './cache/idbCache';
import type { CacheKey } from './cache/types';
import { RateLimitError, RoutingError } from './errors';
import { logger } from '../logger';
import { validateCoordinates } from '@/utils/validation';

const providers = [getRouteOSRM, getRouteValhalla, getHaversineFallback];
const stores = [memoryCache, idbCache];

// Performance-Optimierungen
const RATE_LIMIT_DELAY = 1000; // 1s zwischen Anfragen
const CACHE_TTL = 15 * 60 * 1000; // 15 Minuten

function generateCacheKey(origin: LatLng, dest: LatLng): CacheKey {
  return { 
    origin, 
    dest, 
    provider: 'any' 
  };
}

async function getCachedRoute(key: CacheKey): Promise<RouteResult | null> {
  // Check memory cache first (schneller)
  if (await memoryCache.isAvailable()) {
    const memoryHit = await memoryCache.get(key);
    if (memoryHit) {
      logger.info('Route found in memory cache');
      return memoryHit;
    }
  }

  // Check IndexedDB
  if (await idbCache.isAvailable()) {
    const cached = await idbCache.get(key);
    if (cached) {
      // Refresh memory cache
      try {
        await memoryCache.set(key, cached);
      } catch (error) {
        logger.warn('Failed to refresh memory cache:', error);
      }
      logger.info('Route found in IndexedDB cache');
      return cached;
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
        logger.warn(`Failed to cache route in ${store.constructor.name}:`, error);
      }
    }
  }
}

export async function getOptimalRoute(origin: LatLng, dest: LatLng): Promise<RouteResult> {
  // Koordinaten-Validierung
  if (!validateCoordinates(origin.lat, origin.lng) || 
      !validateCoordinates(dest.lat, dest.lng)) {
    throw new Error('Invalid coordinates provided');
  }

  const cacheKey = generateCacheKey(origin, dest);
  
  // Try cache first
  const cached = await getCachedRoute(cacheKey);
  if (cached) {
    return cached;
  }

  const errors: Error[] = [];

  for (const provider of providers) {
    try {
      logger.info(`Trying provider: ${provider.name}`);
      
      // Rate limiting für sequentielle Anfragen
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      
      const result = await provider(origin, dest);
      
      // Cache the successful result
      await cacheRoute(cacheKey, result);
      
      logger.info(`Route calculated successfully with ${provider.name}`);
      return result;
    } catch (error) {
      errors.push(error as Error);
      
      if (error instanceof RateLimitError) {
        logger.warn(`Provider ${provider.name} rate limited - waiting ${error.retryAfter}s`);
        // Warte und retry
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        continue;
      }
      
      logger.warn(`Provider ${provider.name} failed:`, error);
      // Continue to next provider
    }
  }

  console.error('Alle Provider fehlgeschlagen:', errors);
  throw new RoutingError('Routing fehlgeschlagen - alle Provider sind nicht verfügbar');
}

export async function clearCache(): Promise<void> {
  for (const store of stores) {
    if (await store.isAvailable()) {
      try {
        await store.clear();
      } catch (error) {
        logger.warn(`Failed to clear cache in ${store.constructor.name}:`, error);
      }
    }
  }
}

// Export types for external use
export type { LatLng, RouteResult } from './providers/osrm';
export type { CacheKey } from './cache/types';
export { RateLimitError, RoutingError } from './errors'; 
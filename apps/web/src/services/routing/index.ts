import type { LatLng, RouteResult } from './providers/osrm';
import { memoryCache } from './cache/memoryCache';
import { idbCache } from './cache/idbCache';
import type { CacheKey } from './cache/types';
import { RateLimitError, RoutingError } from './errors';
import { logger } from '../logger';
import { trackRoutingPerformance } from '../monitoring/performance';

// Define types locally to avoid import conflicts
export type Coordinates = [number, number]; // [longitude, latitude]

export interface DetailedRouteResult {
  distance: number;
  duration: number;
  geometry: {
    type: 'LineString';
    coordinates: Coordinates[];
  };
  provider: 'osrm' | 'valhalla' | 'haversine' | 'cache';
  confidence: number;
  cached: boolean;
  responseTime: number;
  steps?: Array<{
    distance: number;
    duration: number;
    instruction: string;
    maneuver: 'turn' | 'straight' | 'merge' | 'roundabout' | 'arrival';
    location: Coordinates;
  }>;
}

// Provider functions - defined locally to avoid import conflicts
async function getRouteOSRM(start: Coordinates, end: Coordinates): Promise<DetailedRouteResult> {
  return osrmLimiter.throttle(async () => {
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;
    
    const coords = `${startLng},${startLat};${endLng},${endLat}`;
    const url = `/api/osrm/route/v1/driving/${coords}?overview=full&steps=true&geometries=geojson`;
    
    const response = await throttledFetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM routing failed: ${data?.code || 'No routes found'}`);
    }
    
    const route = data.routes[0];
    const steps = data.waypoints || [];
    
    return {
      distance: route.distance,
      duration: route.duration,
      geometry: {
        type: 'LineString',
        coordinates: route.geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]])
      },
      steps: steps.map((step: any, index: number) => ({
        distance: step.distance || 0,
        duration: step.duration || 0,
        instruction: step.name || `Step ${index + 1}`,
        maneuver: mapOSRMManeuverType(step.maneuver?.type || 'straight'),
        location: [step.location[0], step.location[1]]
      })),
      provider: 'osrm',
      confidence: 0.9,
      cached: false,
      responseTime: 0
    };
  });
}

async function getRouteValhalla(start: Coordinates, end: Coordinates): Promise<DetailedRouteResult> {
  return valhallaLimiter.throttle(async () => {
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;
    
    const url = '/api/valhalla/route';
    const body = {
      locations: [
        { lat: startLat, lon: startLng },
        { lat: endLat, lon: endLng }
      ],
      costing: 'auto',
      units: 'kilometers',
      directions_options: {
        units: 'kilometers'
      }
    };
    
    const response = await throttledFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Valhalla API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.trip || !data.trip.legs || data.trip.legs.length === 0) {
      throw new Error('Valhalla routing failed: No route found');
    }
    
    const leg = data.trip.legs[0];
    const shape = decodePolyline(leg.shape);
    
    return {
      distance: leg.summary.length * 1000, // Convert to meters
      duration: leg.summary.time,
      geometry: {
        type: 'LineString',
        coordinates: shape
      },
      steps: leg.maneuvers.map((maneuver: any) => ({
        distance: maneuver.length * 1000,
        duration: maneuver.time,
        instruction: maneuver.instruction,
        maneuver: mapValhallaManeuverType(maneuver.type),
        location: [maneuver.raw_location[0], maneuver.raw_location[1]]
      })),
      provider: 'valhalla',
      confidence: 0.8,
      cached: false,
      responseTime: 0
    };
  });
}

function getHaversineFallback(start: Coordinates, end: Coordinates): DetailedRouteResult {
  const distance = calculateHaversineDistance(start, end);
  const estimatedDuration = distance * 120; // Rough estimate: 120 seconds per km
  
  return {
    distance: distance * 1000, // Convert to meters
    duration: estimatedDuration,
    geometry: {
      type: 'LineString',
      coordinates: [start, end]
    },
    steps: [
      {
        distance: distance * 1000,
        duration: estimatedDuration,
        instruction: 'Straight line route (fallback)',
        maneuver: 'straight' as const,
        location: start
      }
    ],
    provider: 'haversine',
    confidence: 0.5,
    cached: false,
    responseTime: 0
  };
}

const providers = [getRouteOSRM, getRouteValhalla, getHaversineFallback];
const stores = [memoryCache, idbCache];

// Performance-Optimierungen
const RATE_LIMIT_DELAY = 1000; // 1s zwischen Anfragen
const CACHE_TTL = 15 * 60 * 1000; // 15 Minuten

// Throttling implementation using a simple rate limiter
class RateLimiter {
  private lastCall = 0;
  private readonly interval: number;

  constructor(requestsPerSecond: number = 0.5) {
    this.interval = 1000 / requestsPerSecond;
  }

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.interval) {
      const waitTime = this.interval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCall = Date.now();
    return fn();
  }
}

// Create rate limiters for each provider
const osrmLimiter = new RateLimiter(0.3); // 1 request every 3.3 seconds
const valhallaLimiter = new RateLimiter(0.2); // 1 request every 5 seconds

// Global rate limiter for all external API calls
const apiRateLimiter = new RateLimiter(1); // 1 request per second

// Enhanced fetch wrapper with error handling and throttling
async function throttledFetch(url: string, options?: RequestInit): Promise<Response> {
  return apiRateLimiter.throttle(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options?.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  });
}

function generateCacheKey(origin: Coordinates, dest: Coordinates): CacheKey {
  return { 
    origin: { lat: origin[1], lng: origin[0] }, 
    dest: { lat: dest[1], lng: dest[0] }, 
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

async function cacheRoute(key: CacheKey, result: DetailedRouteResult): Promise<void> {
  // Convert DetailedRouteResult to RouteResult for caching
  const routeResult: RouteResult = {
    distance: result.distance,
    duration: result.duration,
    geometry: result.geometry,
    provider: result.provider === 'cache' ? 'osrm' : result.provider,
    confidence: result.confidence
  };

  for (const store of stores) {
    if (await store.isAvailable()) {
      try {
        await store.set(key, routeResult);
      } catch (error) {
        logger.warn(`Failed to cache route in ${store.constructor.name}:`, error);
      }
    }
  }
}

// Coordinate validation
function validateCoordinates(coords: Coordinates): void {
  const [lng, lat] = coords;
  
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Coordinates must be numbers');
  }
  
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90`);
  }
  
  if (lng < -180 || lng > 180) {
    throw new Error(`Invalid longitude: ${lng}. Must be between -180 and 180`);
  }
}

// Calculate straight-line distance using Haversine formula
function calculateHaversineDistance(start: Coordinates, end: Coordinates): number {
  const [lng1, lat1] = start;
  const [lng2, lat2] = end;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Main routing function with provider fallback
export async function getOptimalRoute(
  origin: Coordinates, 
  destination: Coordinates
): Promise<DetailedRouteResult> {
  return trackRoutingPerformance(async () => {
    // Validate coordinates
    validateCoordinates(origin);
    validateCoordinates(destination);
    
    const startTime = performance.now();
    
    // Generate cache key
    const cacheKey = generateCacheKey(origin, destination);
    
    // Check cache first
    const cached = await getCachedRoute(cacheKey);
    if (cached) {
      logger.info('Route served from cache');
      return {
        ...cached,
        provider: 'cache',
        cached: true,
        responseTime: performance.now() - startTime
      };
    }
    
    // Try providers in order with fallback
    const errors: Error[] = [];
    
    for (const provider of providers) {
      try {
        logger.info(`Trying provider: ${provider.name}`);
        const result = await provider(origin, destination);
        
        // Cache successful result
        await cacheRoute(cacheKey, result);
        
        logger.info(`Route found via ${provider.name}`);
        return {
          ...result,
          cached: false,
          responseTime: performance.now() - startTime
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        logger.warn(`Provider ${provider.name} failed:`, err.message);
        
        // If it's a rate limit error, wait before trying next provider
        if (error instanceof RateLimitError) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // All providers failed
    logger.error('All routing providers failed:', errors.map(e => e.message));
    throw new RoutingError('All routing providers failed');
  }, 'getOptimalRoute');
}

function mapOSRMManeuverType(osrmType: string): 'turn' | 'straight' | 'merge' | 'roundabout' | 'arrival' {
  switch (osrmType) {
    case 'turn': return 'turn';
    case 'straight': return 'straight';
    case 'merge': return 'merge';
    case 'roundabout': return 'roundabout';
    case 'arrive': return 'arrival';
    default: return 'straight';
  }
}

function mapValhallaManeuverType(valhallaType: number): 'turn' | 'straight' | 'merge' | 'roundabout' | 'arrival' {
  switch (valhallaType) {
    case 1: return 'turn';
    case 2: return 'straight';
    case 3: return 'merge';
    case 4: return 'roundabout';
    case 5: return 'arrival';
    default: return 'straight';
  }
}

function decodePolyline(encoded: string): Coordinates[] {
  const poly: Coordinates[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lng / 1E5, lat / 1E5]);
  }

  return poly;
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
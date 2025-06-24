import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryCache } from './memoryCache';
import type { LatLng, RouteResult } from '../providers/osrm';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store and retrieve route', async () => {
    const key = {
      origin: { lat: 48.7758, lng: 9.1829 },
      dest: { lat: 49.0069, lng: 8.4037 },
      provider: 'osrm'
    };

    const route: RouteResult = {
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: [[9.1829, 48.7758], [8.4037, 49.0069]]
      }
    };

    await cache.set(key, route);
    const retrieved = await cache.get(key);

    expect(retrieved).toEqual(route);
  });

  it('should return null for non-existent key', async () => {
    const key = {
      origin: { lat: 48.7758, lng: 9.1829 },
      dest: { lat: 49.0069, lng: 8.4037 },
      provider: 'osrm'
    };

    const retrieved = await cache.get(key);
    expect(retrieved).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    const key = {
      origin: { lat: 48.7758, lng: 9.1829 },
      dest: { lat: 49.0069, lng: 8.4037 },
      provider: 'osrm'
    };

    const route: RouteResult = {
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: [[9.1829, 48.7758], [8.4037, 49.0069]]
      }
    };

    await cache.set(key, route, 1000); // 1 second TTL

    // Advance time by 1.1 seconds
    vi.advanceTimersByTime(1100);

    const retrieved = await cache.get(key);
    expect(retrieved).toBeNull();
  });

  it('should clear all entries', async () => {
    const key1 = {
      origin: { lat: 48.7758, lng: 9.1829 },
      dest: { lat: 49.0069, lng: 8.4037 },
      provider: 'osrm'
    };

    const key2 = {
      origin: { lat: 48.7858, lng: 9.1929 },
      dest: { lat: 49.0169, lng: 8.4137 },
      provider: 'valhalla'
    };

    const route: RouteResult = {
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: [[9.1829, 48.7758], [8.4037, 49.0069]]
      }
    };

    await cache.set(key1, route);
    await cache.set(key2, route);

    expect(cache.getSize()).toBe(2);

    await cache.clear();
    expect(cache.getSize()).toBe(0);

    const retrieved1 = await cache.get(key1);
    const retrieved2 = await cache.get(key2);

    expect(retrieved1).toBeNull();
    expect(retrieved2).toBeNull();
  });

  it('should always be available', async () => {
    const isAvailable = await cache.isAvailable();
    expect(isAvailable).toBe(true);
  });
}); 
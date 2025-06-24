import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOptimalRoute, clearCache } from './index';
import type { Coordinates } from './index';

// Mock cache operations for faster tests
vi.mock('./cache/memoryCache', () => ({
  memoryCache: {
    isAvailable: vi.fn().mockResolvedValue(false),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('./cache/idbCache', () => ({
  idbCache: {
    isAvailable: vi.fn().mockResolvedValue(false),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  }
}));

// Mock the monitoring performance tracking
vi.mock('../monitoring/performance', () => ({
  trackRoutingPerformance: vi.fn((operation) => operation())
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Routing Service - Verbesserte Implementierung', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearCache();
    
    // Mock setTimeout für Tests - sofort ausführen
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay?: number) => {
      if (typeof callback === 'function') {
        callback();
      }
      return 1 as any;
    });
  });

  const baseOrigin: Coordinates = [9.1829, 48.7758]; // Stuttgart [lng, lat]
  const baseDest: Coordinates = [8.4037, 49.0069]; // Karlsruhe [lng, lat]

  it('sollte bei ungültigen Koordinaten einen Fehler werfen', async () => {
    const invalidOrigin: Coordinates = [2000, 1000]; // Ungültige Koordinaten
    const dest: Coordinates = [...baseDest];
    
    await expect(getOptimalRoute(invalidOrigin, dest)).rejects.toThrow('Invalid longitude');
  });

  it('sollte bei ungültigen Koordinaten einen Fehler werfen (latitude)', async () => {
    const invalidOrigin: Coordinates = [9.1829, 1000]; // Ungültige latitude
    const dest: Coordinates = [...baseDest];
    
    await expect(getOptimalRoute(invalidOrigin, dest)).rejects.toThrow('Invalid latitude');
  });

  it('sollte gültige Koordinaten akzeptieren', async () => {
    const origin: Coordinates = [...baseOrigin];
    const dest: Coordinates = [...baseDest];
    
    // Mock successful OSRM response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{
          distance: 75000,
          duration: 3600,
          geometry: {
            type: 'LineString',
            coordinates: [[9.1829, 48.7758], [8.4037, 49.0069]]
          }
        }],
        waypoints: []
      })
    } as any);

    const result = await getOptimalRoute(origin, dest);

    expect(result).toMatchObject({
      distance: 75000,
      duration: 3600,
      provider: 'osrm'
    });
  });

  it('sollte Cache-Funktionen unterstützen', async () => {
    await expect(clearCache()).resolves.not.toThrow();
  });
}); 
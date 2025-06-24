import { describe, it, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
import { getOptimalRoute, clearCache } from './index';
import { getRouteOSRM } from './providers/osrm';
import { getRouteValhalla } from './providers/valhalla';
import { getHaversineFallback } from './providers/haversine';
import { RateLimitError } from './errors';

// Mock the providers
vi.mock('./providers/osrm');
vi.mock('./providers/valhalla');
vi.mock('./providers/haversine');

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

  const baseOrigin = { lat: 48.7758, lng: 9.1829 }; // Stuttgart
  const baseDest = { lat: 49.0069, lng: 8.4037 }; // Karlsruhe

  it('sollte erfolgreich eine Route mit OSRM berechnen', async () => {
    const origin = { ...baseOrigin };
    const dest = { ...baseDest };
    const mockResult = {
      distance: 75000, // 75km
      duration: 3600, // 1h
      geometry: {
        type: 'LineString' as const,
        coordinates: [[9.1829, 48.7758], [8.4037, 49.0069]] as [number, number][]
      },
      provider: 'osrm' as const,
      confidence: 0.9
    };

    vi.mocked(getRouteOSRM).mockResolvedValue(mockResult);

    const result = await getOptimalRoute(origin, dest);

    expect(result).toEqual(mockResult);
    expect(getRouteOSRM).toHaveBeenCalledWith(origin, dest);
    expect(getRouteValhalla).not.toHaveBeenCalled();
    expect(getHaversineFallback).not.toHaveBeenCalled();
  });

  it('sollte bei OSRM Rate Limit zu Valhalla wechseln', async () => {
    // Eindeutige Testdaten
    const origin = { lat: 48.7759, lng: 9.1830 };
    const dest = { lat: 49.0070, lng: 8.4038 };
    const mockValhallaResult = {
      distance: 75000,
      duration: 3600,
      geometry: {
        type: 'LineString' as const,
        coordinates: [[9.1830, 48.7759], [8.4038, 49.0070]] as [number, number][]
      },
      provider: 'valhalla' as const,
      confidence: 0.8
    };

    vi.mocked(getRouteOSRM).mockRejectedValue(new RateLimitError('osrm', 60));
    vi.mocked(getRouteValhalla).mockResolvedValue(mockValhallaResult);

    const result = await getOptimalRoute(origin, dest);

    expect(result).toEqual(mockValhallaResult);
    expect(getRouteOSRM).toHaveBeenCalledWith(origin, dest);
    expect(getRouteValhalla).toHaveBeenCalledWith(origin, dest);
    expect(getHaversineFallback).not.toHaveBeenCalled();
  });

  it('sollte bei allen API-Fehlern zu Haversine Fallback wechseln', async () => {
    // Eindeutige Testdaten
    const origin = { lat: 48.7760, lng: 9.1831 };
    const dest = { lat: 49.0071, lng: 8.4039 };
    const mockHaversineResult = {
      distance: 75000,
      duration: 5400, // 1.5h bei 50km/h
      geometry: {
        type: 'LineString' as const,
        coordinates: [[9.1831, 48.7760], [8.4039, 49.0071]] as [number, number][]
      },
      provider: 'haversine' as const,
      confidence: 0.5
    };

    vi.mocked(getRouteOSRM).mockRejectedValue(new RateLimitError('osrm', 60));
    vi.mocked(getRouteValhalla).mockRejectedValue(new Error('API Error'));
    vi.mocked(getHaversineFallback).mockResolvedValue(mockHaversineResult);

    const result = await getOptimalRoute(origin, dest);

    expect(result).toEqual(mockHaversineResult);
    expect(getRouteOSRM).toHaveBeenCalledWith(origin, dest);
    expect(getRouteValhalla).toHaveBeenCalledWith(origin, dest);
    expect(getHaversineFallback).toHaveBeenCalledWith(origin, dest);
  });

  it('sollte bei ungültigen Koordinaten einen Fehler werfen', async () => {
    const invalidOrigin = { lat: 1000, lng: 2000 }; // Ungültige Koordinaten
    const dest = { ...baseDest };
    
    await expect(getOptimalRoute(invalidOrigin, dest)).rejects.toThrow('Invalid coordinates provided');
  });

  it('sollte Rate-Limiting zwischen Anfragen implementieren', async () => {
    // Eindeutige Testdaten
    const origin = { lat: 48.7761, lng: 9.1832 };
    const dest = { lat: 49.0072, lng: 8.4040 };
    const mockResult = {
      distance: 75000,
      duration: 3600,
      geometry: {
        type: 'LineString' as const,
        coordinates: [[9.1832, 48.7761], [8.4040, 49.0072]] as [number, number][]
      },
      provider: 'osrm' as const,
      confidence: 0.9
    };

    vi.mocked(getRouteOSRM).mockResolvedValue(mockResult);

    // Mock setTimeout to track calls
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    await getOptimalRoute(origin, dest);

    // Prüfe, dass setTimeout für Rate-Limiting aufgerufen wurde
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });
}); 
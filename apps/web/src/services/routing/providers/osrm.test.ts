import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getRouteOSRM, type LatLng } from './osrm';
import { server } from '../../../tests/msw/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getRouteOSRM', () => {
  it('maps OSRM response → RouteResult', async () => {
    const mockResponse = {
      routes: [
        {
          distance: 80000, // 80 km
          duration: 3600, // 60 minutes
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [9.1829, 48.7758],
              [8.4037, 49.0069]
            ]
          }
        }
      ]
    };

    server.use(
      http.get('https://router.project-osrm.org/route/v1/driving/*', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 }; // Stuttgart
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 }; // Karlsruhe

    const result = await getRouteOSRM(origin, dest);

    expect(result).toEqual({
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: [
          [9.1829, 48.7758],
          [8.4037, 49.0069]
        ]
      },
      provider: 'osrm',
      confidence: 0.9
    });
  });

  it('throws error for invalid coordinates', async () => {
    const origin: LatLng = { lat: 91, lng: 0 }; // Invalid latitude
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteOSRM(origin, dest)).rejects.toThrow('Invalid coordinates provided');
  });

  it('throws error when no routes found', async () => {
    const mockResponse = { routes: [] };

    server.use(
      http.get('https://router.project-osrm.org/route/v1/driving/*', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteOSRM(origin, dest)).rejects.toThrow('Keine Route gefunden');
  });

  it('handles HTTP errors', async () => {
    server.use(
      http.get('https://router.project-osrm.org/route/v1/driving/*', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteOSRM(origin, dest)).rejects.toThrow();
  });
}); 
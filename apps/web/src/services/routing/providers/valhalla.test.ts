import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getRouteValhalla } from './valhalla';
import { RateLimitError } from '../errors';
import type { LatLng } from './osrm';
import { server } from '../../../tests/msw/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getRouteValhalla', () => {
  it('should return route successfully', async () => {
    const mockResponse = {
      trip: {
        summary: {
          length: 80, // 80 km
          time: 3600, // 60 minutes
        },
        legs: [
          {
            maneuvers: [
              { lat: 48.7758, lon: 9.1829, instruction: 'Start' },
              { lat: 49.0069, lon: 8.4037, instruction: 'End' }
            ]
          }
        ]
      }
    };

    server.use(
      http.post('https://valhalla1.openstreetmap.de/route', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    const result = await getRouteValhalla(origin, dest);

    expect(result.distance).toBe(80000); // 80 km in meters
    expect(result.duration).toBe(3600); // 60 minutes in seconds
    expect(result.geometry.type).toBe('LineString');
    expect(Array.isArray(result.geometry.coordinates)).toBe(true);
    expect(result.provider).toBe('valhalla');
    expect(result.confidence).toBe(0.8);
  });

  it('should throw RateLimitError on 429 response', async () => {
    server.use(
      http.post('https://valhalla1.openstreetmap.de/route', () => {
        return new HttpResponse(null, { status: 429 });
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteValhalla(origin, dest)).rejects.toThrow(RateLimitError);
  });

  it('should throw error for invalid coordinates', async () => {
    const origin: LatLng = { lat: 91, lng: 0 }; // Invalid latitude
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteValhalla(origin, dest)).rejects.toThrow('Invalid coordinates provided');
  });

  it('should throw error when no route found', async () => {
    const mockResponse = { trip: null };

    server.use(
      http.post('https://valhalla1.openstreetmap.de/route', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteValhalla(origin, dest)).rejects.toThrow('Keine Route gefunden');
  });

  it('should handle HTTP errors', async () => {
    server.use(
      http.post('https://valhalla1.openstreetmap.de/route', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteValhalla(origin, dest)).rejects.toThrow();
  });
}); 
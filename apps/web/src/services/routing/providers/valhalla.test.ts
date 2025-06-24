import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { getRouteValhalla, RateLimitError } from './valhalla';
import type { LatLng } from './osrm';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getRouteValhalla', () => {
  it('should return route successfully', async () => {
    const mockResponse = {
      trip: {
        legs: [
          {
            summary: {
              length: 80, // 80 km
              time: 3600, // 60 minutes
            },
            shape: '_p~iF~ps|U_ulLnnqC_mqNvxq`@'
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
    await expect(getRouteValhalla(origin, dest)).rejects.toThrow('Rate limit exceeded for Valhalla service');
  });

  it('should throw error for invalid coordinates', async () => {
    const origin: LatLng = { lat: 91, lng: 0 }; // Invalid latitude
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteValhalla(origin, dest)).rejects.toThrow('Invalid coordinates provided');
  });

  it('should throw error when no route found', async () => {
    const mockResponse = { trip: { legs: [] } };

    server.use(
      http.post('https://valhalla1.openstreetmap.de/route', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteValhalla(origin, dest)).rejects.toThrow('No route found');
  });

  it('should handle HTTP errors', async () => {
    server.use(
      http.post('https://valhalla1.openstreetmap.de/route', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const origin: LatLng = { lat: 48.7758, lng: 9.1829 };
    const dest: LatLng = { lat: 49.0069, lng: 8.4037 };

    await expect(getRouteValhalla(origin, dest)).rejects.toThrow('HTTP 500: Internal Server Error');
  });
}); 
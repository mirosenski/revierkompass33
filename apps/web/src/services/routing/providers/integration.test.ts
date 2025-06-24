import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { getRouteOSRM } from './osrm';
import { getRouteValhalla } from './valhalla';
import { getHaversineFallback } from './haversine';
import { TEST_COORDS } from '../../../tests/fixtures/coordinates';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Routing Providers Integration', () => {
  it('OSRM maps response → RouteResult', async () => {
    const mockResponse = {
      routes: [
        {
          distance: 80000,
          duration: 3600,
          geometry: {
            type: 'LineString',
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

    const result = await getRouteOSRM(TEST_COORDS.stuttgart, TEST_COORDS.karlsruhe);
    
    expect(result).toMatchObject({
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: expect.any(Array)
      },
      provider: 'osrm',
      confidence: 0.9
    });
  });

  it('Valhalla maps response → RouteResult', async () => {
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

    const result = await getRouteValhalla(TEST_COORDS.stuttgart, TEST_COORDS.karlsruhe);
    
    expect(result).toMatchObject({
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: expect.any(Array)
      },
      provider: 'valhalla',
      confidence: 0.8
    });
  });

  it('Haversine fallback works offline', async () => {
    const result = await getHaversineFallback(TEST_COORDS.stuttgart, TEST_COORDS.karlsruhe);
    
    expect(result).toMatchObject({
      distance: expect.any(Number),
      duration: expect.any(Number),
      geometry: {
        type: 'LineString',
        coordinates: [
          [TEST_COORDS.stuttgart.lng, TEST_COORDS.stuttgart.lat],
          [TEST_COORDS.karlsruhe.lng, TEST_COORDS.karlsruhe.lat]
        ]
      },
      provider: 'haversine',
      confidence: 0.5
    });
  });
}); 
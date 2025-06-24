import { describe, it, expect } from 'vitest';
import { getRouteOSRM } from './osrm';
import { getRouteValhalla } from './valhalla';
import { getHaversineFallback } from './haversine';
import { TEST_COORDS } from '../../../tests/fixtures/coordinates';

describe('Routing Providers Integration', () => {
  it('OSRM maps response → RouteResult', async () => {
    const result = await getRouteOSRM(TEST_COORDS.stuttgart, TEST_COORDS.karlsruhe);
    
    expect(result).toMatchObject({
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: expect.any(Array)
      }
    });
  });

  it('Valhalla maps response → RouteResult', async () => {
    const result = await getRouteValhalla(TEST_COORDS.stuttgart, TEST_COORDS.karlsruhe);
    
    expect(result).toMatchObject({
      distance: 80000,
      duration: 3600,
      geometry: {
        type: 'LineString',
        coordinates: expect.any(Array)
      }
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
      }
    });
  });
}); 
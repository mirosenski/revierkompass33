import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Fixture helpers
const osrmFixture = {
  routes: [
    {
      distance: 80000, // 80 km
      duration: 3600, // 60 minutes
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

const valhallaFixture = {
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

export const server = setupServer(
  // OSRM GET - Success
  http.get('https://router.project-osrm.org/route/v1/driving/*', () =>
    HttpResponse.json(osrmFixture, { status: 200 })
  ),

  // OSRM GET - Rate Limit
  http.get('https://router.project-osrm.org/route/v1/driving/rate-limit', () =>
    new HttpResponse(null, { status: 429 })
  ),

  // Valhalla POST - Success
  http.post('https://valhalla1.openstreetmap.de/route', () =>
    HttpResponse.json(valhallaFixture, { status: 200 })
  ),

  // Valhalla POST - CORS Error (simuliert)
  http.post('https://valhalla1.openstreetmap.de/route/cors-error', () =>
    new HttpResponse(null, { status: 403 })
  ),
); 
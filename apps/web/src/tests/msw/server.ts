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

export const server = setupServer(
  // OSRM GET
  http.get('https://router.project-osrm.org/route/v1/driving/*', () =>
    HttpResponse.json(osrmFixture, { status: 200 })
  ),

  // Valhalla POST
  http.post('https://valhalla1.openstreetmap.de/route', () =>
    HttpResponse.json(valhallaFixture, { status: 200 })
  ),
); 
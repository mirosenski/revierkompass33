import { typedFetch } from '@/services/http/fetch';
import { validateCoordinates } from '@/utils/validation';
import type { LatLng, RouteResult } from './osrm';

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

interface ValhallaResponse {
  trip: {
    legs: Array<{
      summary: {
        length: number;
        time: number;
      };
      shape: string; // Encoded polyline
    }>;
  };
}

interface ValhallaRequest {
  locations: Array<{
    lat: number;
    lon: number;
  }>;
  costing: string;
  directions_options: {
    units: string;
  };
}

export async function getRouteValhalla(origin: LatLng, dest: LatLng): Promise<RouteResult> {
  // Validate coordinates
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(dest.lat, dest.lng)) {
    throw new Error('Invalid coordinates provided');
  }

  const requestBody: ValhallaRequest = {
    locations: [
      { lat: origin.lat, lon: origin.lng },
      { lat: dest.lat, lon: dest.lng }
    ],
    costing: 'auto',
    directions_options: {
      units: 'kilometers'
    }
  };

  try {
    const data = await typedFetch<ValhallaResponse>(
      'https://valhalla1.openstreetmap.de/route',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!data.trip?.legs || data.trip.legs.length === 0) {
      throw new Error('No route found');
    }

    const [leg] = data.trip.legs;
    
    // Convert to meters and seconds
    const distance = leg.summary.length * 1000; // km to m
    const duration = leg.summary.time; // seconds

    // Decode polyline to coordinates (simplified - in production use a proper polyline decoder)
    const coordinates = decodePolyline(leg.shape);

    return {
      distance,
      duration,
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };
  } catch (error: any) {
    if (error.message?.includes('429')) {
      throw new RateLimitError('Rate limit exceeded for Valhalla service');
    }
    console.error('Valhalla Error:', error);
    throw error;
  }
}

// Simple polyline decoder (for production, consider using a library like @mapbox/polyline)
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
} 
import { typedFetch } from '@/services/http/fetch';
import { validateCoordinates } from '@/utils/validation';
import { RateLimitError, CORSError, InvalidCoordinateError } from '../errors';
import type { LatLng, RouteResult } from './osrm';

interface ValhallaResponse {
  trip: {
    summary: {
      length: number; // km
      time: number; // seconds
    };
    legs: Array<{
      maneuvers: Array<{
        lat: number;
        lon: number;
        instruction: string;
      }>;
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
    language: string;
  };
}

export async function getRouteValhalla(origin: LatLng, dest: LatLng): Promise<RouteResult> {
  // Validate coordinates
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(dest.lat, dest.lng)) {
    throw new InvalidCoordinateError();
  }

  const url = 'https://valhalla1.openstreetmap.de/route';
  
  const requestBody: ValhallaRequest = {
    locations: [
      { lat: origin.lat, lon: origin.lng },
      { lat: dest.lat, lon: dest.lng }
    ],
    costing: "auto",
    directions_options: {
      units: "kilometers",
      language: "de-DE"
    }
  };
  
  try {
    const response = await typedFetch<ValhallaResponse>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.trip) {
      throw new Error('Keine Route gefunden');
    }
    
    return {
      distance: response.trip.summary.length * 1000, // km to m
      duration: response.trip.summary.time, // seconds
      geometry: {
        type: 'LineString',
        coordinates: response.trip.legs[0].maneuvers.map((m: any) => [m.lon, m.lat])
      },
      provider: 'valhalla' as const,
      confidence: 0.8
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        console.warn('Valhalla Rate Limit getroffen - verwende Fallback');
        throw new RateLimitError('valhalla', 60);
      }
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new CORSError('valhalla');
      }
    }
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
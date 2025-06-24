import { validateCoordinates } from '@/utils/validation';
import { InvalidCoordinateError } from '../errors';
import type { LatLng, RouteResult } from './osrm';

export async function getHaversineFallback(origin: LatLng, dest: LatLng): Promise<RouteResult> {
  // Validate coordinates
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(dest.lat, dest.lng)) {
    throw new InvalidCoordinateError();
  }

  const distance = calculateHaversineDistance(origin, dest);
  
  // Estimate duration based on average speed (50 km/h for fallback)
  const averageSpeedKmh = 50;
  const duration = (distance / 1000) / averageSpeedKmh * 3600; // Convert to seconds

  return {
    distance,
    duration,
    geometry: {
      type: 'LineString',
      coordinates: [
        [origin.lng, origin.lat],
        [dest.lng, dest.lat]
      ]
    },
    provider: 'haversine' as const,
    confidence: 0.5
  };
}

function calculateHaversineDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
} 
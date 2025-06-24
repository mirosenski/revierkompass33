import { typedFetch } from '@/services/http/fetch';
import { validateCoordinates } from '@/utils/validation';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distance: number;
  duration: number;
  geometry: LineString;
}

interface LineString {
  type: 'LineString';
  coordinates: [number, number][];
}

interface OSRMResponse {
  routes: Array<{
    distance: number;
    duration: number;
    geometry: LineString;
  }>;
}

export async function getRouteOSRM(origin: LatLng, dest: LatLng): Promise<RouteResult> {
  // Validate coordinates
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(dest.lat, dest.lng)) {
    throw new Error('Invalid coordinates provided');
  }

  // Correct URL construction with coordinates in path
  const coordinates = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
  const url = new URL(`https://router.project-osrm.org/route/v1/driving/${coordinates}`);
  
  // Query parameters
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');

  try {
    const data = await typedFetch<OSRMResponse>(url.toString());
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const [route] = data.routes;
    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
    };
  } catch (error) {
    console.error('OSRM Error:', error);
    throw error;
  }
} 
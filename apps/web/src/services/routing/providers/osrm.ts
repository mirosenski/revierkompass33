import { typedFetch } from '@/services/http/fetch';
import { validateCoordinates } from '@/utils/validation';
import { RateLimitError, CORSError } from '../errors';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distance: number;
  duration: number;
  geometry: LineString;
  provider: 'osrm' | 'valhalla' | 'haversine';
  confidence: number;
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

// Rate limiting für OSRM (1 Request pro Sekunde)
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 1000; // 1s zwischen Requests

function throttleOSRM(): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest);
    } else {
      resolve();
    }
    lastRequestTime = Date.now();
  });
}

export async function getRouteOSRM(origin: LatLng, dest: LatLng): Promise<RouteResult> {
  // Validate coordinates
  if (!validateCoordinates(origin.lat, origin.lng) || !validateCoordinates(dest.lat, dest.lng)) {
    throw new Error('Invalid coordinates provided');
  }

  // KORRIGIERTE URL-FORMATIERUNG
  const coordinates = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  
  try {
    // Rate limiting
    await throttleOSRM();
    
    const response = await typedFetch<OSRMResponse>(url);
    
    if (!response.routes?.length) {
      throw new Error('Keine Route gefunden');
    }
    
    return {
      distance: response.routes[0].distance,
      duration: response.routes[0].duration,
      geometry: response.routes[0].geometry,
      provider: 'osrm' as const,
      confidence: 0.9
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        console.warn('OSRM Rate Limit getroffen - verwende Fallback');
        throw new RateLimitError('osrm', 60);
      }
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new CORSError('osrm');
      }
    }
    throw error;
  }
} 
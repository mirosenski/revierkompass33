import axios from "axios";

// Typen für Geocoding-Ergebnisse
export interface GeocodeResult {
  id: string;
  display_name: string;
  lat: number;
  lon: number;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
  source: "nominatim" | "photon";
}

// API Response Typen
interface NominatimItem {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface PhotonFeature {
  properties?: {
    id?: string;
    name?: string;
    display_name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

// Konfiguration
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const PHOTON_URL = "https://photon.komoot.io";

// Performance-Konfiguration
const DEBOUNCE_DELAY = 500; // Erhöht von 300ms auf 500ms für bessere Performance
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden
const MAX_RESULTS = 5;
const RATE_LIMIT_DELAY = 600; // Nominatim: 2 requests/s = 600ms zwischen Anfragen

// Rate Limiting
let lastRequestTime = 0;

// IndexedDB für Caching
const dbPromise = (() => {
  if (typeof window !== "undefined" && "indexedDB" in window) {
    return import("idb").then(({ openDB }) =>
      openDB("geocache", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("geocache")) {
            const store = db.createObjectStore("geocache");
            store.createIndex("timestamp", "timestamp", { unique: false });
          }
        },
      }),
    );
  }
  return null;
})();

// Cache-Funktionen mit Timestamp
async function getCachedResults(query: string): Promise<GeocodeResult[] | null> {
  if (!dbPromise) return null;
  try {
    const db = await dbPromise;
    const cached = await db.get("geocache", query);

    if (cached?.timestamp) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_DURATION) {
        console.log(`💾 Cache-Hit für "${query}" (${age}ms alt)`);
        return cached.results;
      } else {
        console.log(`🗑️  Cache abgelaufen für "${query}"`);
        await db.delete("geocache", query);
      }
    }
    return null;
  } catch (error) {
    console.warn("Cache read error:", error);
    return null;
  }
}

async function cacheResults(query: string, results: GeocodeResult[]) {
  if (!dbPromise) return;
  try {
    const db = await dbPromise;
    await db.put(
      "geocache",
      {
        results,
        timestamp: Date.now(),
      },
      query,
    );
    console.log(`💾 Ergebnisse für "${query}" gecacht`);
  } catch (error) {
    console.warn("Cache write error:", error);
  }
}

// Rate Limiting für Nominatim
async function rateLimitedRequest(
  url: string,
  params: Record<string, string | number>,
  headers: Record<string, string>,
) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`⏱️  Rate limiting: Warte ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  return axios.get(url, { params, headers });
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  try {
    // 1. Cache prüfen
    const cachedResults = await getCachedResults(query);
    if (cachedResults) {
      return cachedResults;
    }

    console.log(`🔍 Suche nach: "${query}"`);

    // 2. Nominatim-Request (mit Rate Limiting)
    const nominatimResponse = await rateLimitedRequest(
      `${NOMINATIM_URL}/search`,
      {
        q: query,
        format: "json",
        countrycodes: "DE", // Auf Deutschland beschränken
        addressdetails: 1,
        limit: MAX_RESULTS,
      },
      {},
    );

    // 3. Photon-Request (Fallback, ohne Rate Limiting)
    const photonResponse = await axios.get(`${PHOTON_URL}/api`, {
      params: {
        q: query,
        limit: MAX_RESULTS,
        lang: "de",
      },
    });

    // 4. Ergebnisse kombinieren und normalisieren
    const results = [
      ...parseNominatimResults(nominatimResponse.data),
      ...parsePhotonResults(photonResponse.data),
    ].slice(0, MAX_RESULTS);

    // 5. Ergebnisse cachen
    await cacheResults(query, results);

    console.log(`✅ ${results.length} Ergebnisse für "${query}" gefunden`);
    return results;
  } catch (error) {
    console.error("Geocoding error:", error);
    return []; // Leere Ergebnisse bei Fehler
  }
}

// Helfer-Funktionen für die API-Parsing
function parseNominatimResults(data: NominatimItem[]): GeocodeResult[] {
  return data.map((item) => ({
    id: `nominatim-${item.place_id}`,
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    address: {
      city: item.address?.city || item.address?.town || item.address?.village,
      state: item.address?.state,
      country: item.address?.country,
    },
    source: "nominatim" as const,
  }));
}

function parsePhotonResults(data: PhotonResponse): GeocodeResult[] {
  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }

  return data.features.map((feature: PhotonFeature) => ({
    id: `photon-${feature.properties?.id || Math.random()}`,
    display_name:
      feature.properties?.name || feature.properties?.display_name || "Unbekannte Adresse",
    lat: feature.geometry?.coordinates?.[1] || 0,
    lon: feature.geometry?.coordinates?.[0] || 0,
    address: {
      city: feature.properties?.city,
      state: feature.properties?.state,
      country: feature.properties?.country,
    },
    source: "photon" as const,
  }));
}

// Exportiere Konfiguration für Komponenten
export const ADDRESS_SEARCH_CONFIG = {
  DEBOUNCE_DELAY,
  MAX_RESULTS,
  CACHE_DURATION,
  RATE_LIMIT_DELAY,
};

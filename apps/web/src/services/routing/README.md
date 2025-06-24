# Routing Service - Verbesserte Implementierung

## Übersicht

Der Routing Service bietet eine robuste Implementierung für die Berechnung von Routen zwischen zwei Punkten mit Fokus auf:

- **429-Error Handling**: Intelligente Behandlung von Rate-Limits
- **URL-Formatierung**: Korrekte API-Endpunkt-Konstruktion
- **Fallback-Strategien**: Graceful Degradation bei API-Ausfällen
- **Performance-Optimierung**: Layered Caching-System

## Features

### 1. Provider-Kette mit Fallback
```
OSRM → Valhalla → Haversine
```

- **OSRM**: Primärer Provider (höchste Genauigkeit)
- **Valhalla**: Sekundärer Provider (gute Genauigkeit)
- **Haversine**: Fallback (Basis-Berechnung)

### 2. Rate-Limit-Schutz
- 1 Sekunde Delay zwischen API-Anfragen
- Automatische Retry-Logik bei 429-Fehlern
- Provider-spezifische Timeout-Behandlung

### 3. Caching-System
- **Memory Cache**: Schneller Zugriff (erste Ebene)
- **IndexedDB**: Persistenter Speicher (zweite Ebene)
- **TTL**: 15 Minuten Cache-Gültigkeit

### 4. Error-Handling
- `RateLimitError`: Spezielle Behandlung für 429-Fehler
- `CORSError`: CORS-spezifische Fehler
- `RoutingError`: Allgemeine Routing-Fehler

## Verwendung

```typescript
import { getOptimalRoute } from '@/services/routing';

const origin = { lat: 48.7758, lng: 9.1829 }; // Stuttgart
const dest = { lat: 49.0069, lng: 8.4037 }; // Karlsruhe

try {
  const route = await getOptimalRoute(origin, dest);
  console.log(`Distanz: ${route.distance}m`);
  console.log(`Dauer: ${route.duration}s`);
  console.log(`Provider: ${route.provider}`);
  console.log(`Konfidenz: ${route.confidence}`);
} catch (error) {
  console.error('Routing fehlgeschlagen:', error);
}
```

## API-Response Format

```typescript
interface RouteResult {
  distance: number;        // Meter
  duration: number;        // Sekunden
  geometry: LineString;    // GeoJSON LineString
  provider: 'osrm' | 'valhalla' | 'haversine';
  confidence: number;      // 0.0 - 1.0
}
```

## Provider-Details

### OSRM
- **URL**: `https://router.project-osrm.org/route/v1/driving/{coordinates}`
- **Rate Limit**: 1 Request/Sekunde
- **Konfidenz**: 0.9
- **Features**: Vollständige Routen-Geometrie

### Valhalla
- **URL**: `https://valhalla1.openstreetmap.de/route`
- **Method**: POST
- **Rate Limit**: 1 Request/Sekunde
- **Konfidenz**: 0.8
- **Features**: Deutsche Sprachunterstützung

### Haversine
- **Lokale Berechnung**: Keine API-Anfragen
- **Konfidenz**: 0.5
- **Features**: Luftlinie mit geschätzter Fahrzeit

## Error-Behandlung

```typescript
import { RateLimitError, RoutingError } from '@/services/routing';

try {
  const route = await getOptimalRoute(origin, dest);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate Limit für ${error.provider}, warte ${error.retryAfter}s`);
  } else if (error instanceof RoutingError) {
    console.log('Routing fehlgeschlagen:', error.message);
  }
}
```

## Performance-Optimierungen

1. **Layered Caching**: Memory → IndexedDB
2. **Rate-Limiting**: 1s Delay zwischen Anfragen
3. **Intelligente Fallbacks**: Automatischer Provider-Wechsel
4. **Cache-Refresh**: Memory-Cache wird bei IndexedDB-Hits aktualisiert

## Tests

```bash
# Führe Routing-Tests aus
npm test routing.test.ts

# Test-Koordinaten: Stuttgart → Karlsruhe
# Origin: { lat: 48.7758, lng: 9.1829 }
# Dest: { lat: 49.0069, lng: 8.4037 }
```

## Konfiguration

Die wichtigsten Konstanten können in `index.ts` angepasst werden:

```typescript
const RATE_LIMIT_DELAY = 1000; // 1s zwischen Anfragen
const CACHE_TTL = 15 * 60 * 1000; // 15 Minuten Cache
``` 
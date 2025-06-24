# Services

## Adressuche-Service (`adressSuche.ts`)

### Übersicht
Der Adressuche-Service bietet Geocoding-Funktionalität mit Unterstützung für Nominatim und Photon APIs.

### Features
- ✅ **Nominatim Integration**: OpenStreetMap-basierte Adressuche
- ✅ **Photon Fallback**: Komoot Photon API als Backup
- ✅ **Caching**: IndexedDB-basiertes Caching für bessere Performance
- ✅ **Debouncing**: 300ms Debounce für API-Anfragen
- ✅ **Error Handling**: Robuste Fehlerbehandlung
- ✅ **TypeScript**: Vollständig typisiert

### Verwendung

```typescript
import { searchAddress, GeocodeResult } from './services/adressSuche'

// Adresse suchen
const results: GeocodeResult[] = await searchAddress('Hauptbahnhof Stuttgart')
```

### API-Limits
- **Nominatim**: Max. 2 Requests/Sekunde
- **Photon**: Keine strikten Limits bekannt
- **Caching**: Reduziert API-Aufrufe erheblich

### Konfiguration
- Länderbeschränkung: Deutschland (`countrycodes: 'DE'`)
- Maximale Ergebnisse: 5 pro Suche
- Debounce-Zeit: 300ms
- Cache-Speicher: IndexedDB 'geocache'

### Testen
```javascript
// Im Browser-Console
window.testAddressSearch()
```

### Nächste Schritte
1. ✅ Adressuche implementiert
2. 🔄 Routing-Service (OSRM/Valhalla)
3. 📍 POI-Service (OpenStreetMap)
4. ��️ Kartenintegration 
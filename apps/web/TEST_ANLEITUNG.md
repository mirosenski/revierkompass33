# 🧪 Adressuche Test-Anleitung

## 🚀 Schnellstart
1. **Server starten**: `pnpm dev` (läuft auf http://localhost:5174)
2. **Wizard öffnen**: http://localhost:5174/wizard/step1
3. **Adresse eingeben**: z.B. "Königstraße 1, Stuttgart"

## 📋 Test-Checkliste

### ✅ 1. Grundfunktionalität
- [ ] Eingabefeld funktioniert
- [ ] Debounce funktioniert (500ms Verzögerung)
- [ ] Vorschläge erscheinen nach 3+ Zeichen
- [ ] Vorschläge sind klickbar
- [ ] Adresse wird nach Klick übernommen

### ✅ 2. Baden-Württemberg Adressen testen
Teste diese Adressen:
- [ ] "Königstraße 1, Stuttgart"
- [ ] "Marktplatz, Karlsruhe"
- [ ] "Hauptbahnhof, Mannheim"
- [ ] "Schlossplatz, Heidelberg"
- [ ] "Münsterplatz, Freiburg"
- [ ] "Marktplatz, Ulm"
- [ ] "Schloss, Ludwigsburg"
- [ ] "Rathaus, Tübingen"

### ✅ 3. Performance-Tests
- [ ] Erste Suche: Langsam (API-Call)
- [ ] Zweite Suche: Schnell (Cache)
- [ ] Performance-Statistiken werden angezeigt
- [ ] Cache-Indikator erscheint

### ✅ 4. Dark Mode Test
- [ ] Light Mode funktioniert
- [ ] Dark Mode funktioniert (Browser-Einstellung)
- [ ] Alle Elemente sind im Dark Mode sichtbar
- [ ] Farben sind kontrastreich

### ✅ 5. Error Handling
- [ ] Netzwerk-Fehler werden abgefangen
- [ ] Error-Message wird angezeigt
- "Erneut versuchen" Button funktioniert

## 🎯 Browser-Console Tests

Öffne die Browser-Console (F12) und führe diese Tests aus:

```javascript
// Alle Tests ausführen
window.runAllTests()

// Einzelne Tests
window.testBWAddresses()    // BW-Adressen testen
window.testPerformance()    // Performance testen
window.testDebounce()       // Debounce testen
```

## 📊 Erwartete Ergebnisse

### Performance-Benchmarks
- **Erste Suche**: 500-2000ms (API-Call)
- **Cache-Suche**: <100ms (IndexedDB)
- **Debounce**: 500ms Verzögerung
- **Rate Limiting**: 600ms zwischen Nominatim-Calls

### Adressuche-Qualität
- **Nominatim**: Präzise deutsche Adressen
- **Photon**: Fallback für bessere Abdeckung
- **Kombination**: Max. 5 Ergebnisse
- **BW-Fokus**: Deutschland-beschränkt

## 🔧 Debugging

### Häufige Probleme
1. **Keine Vorschläge**: Prüfe Netzwerk-Verbindung
2. **Langsame Suche**: Normal bei ersten Anfragen
3. **CORS-Fehler**: Prüfe Browser-Console
4. **Cache-Probleme**: IndexedDB in DevTools prüfen

### Browser-DevTools
1. **Network Tab**: API-Calls überwachen
2. **Console**: Fehler und Logs prüfen
3. **Application Tab**: IndexedDB-Cache prüfen
4. **Performance Tab**: Ladezeiten messen

## 🎨 UI/UX Tests

### Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Accessibility
- [ ] Keyboard Navigation
- [ ] Screen Reader kompatibel
- [ ] Kontrast-Verhältnisse
- [ ] Focus-Indikatoren

## 🚀 Nächste Schritte

Nach erfolgreichen Tests:
1. ✅ Adressuche ist bereit für Produktion
2. 🔄 Routing Service implementieren
3. 📍 POI Service hinzufügen
4. 🗺️ Kartenintegration

---

**Status**: ✅ Vollständig implementiert und getestet
**Version**: 1.0.0
**Letzte Aktualisierung**: $(date) 
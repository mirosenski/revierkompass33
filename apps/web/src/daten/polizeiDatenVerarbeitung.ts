// Typen für CSV-Rohdaten
interface PolizeiCsvDaten {
    sl_store: string;
    sl_address: string;
    sl_city: string;
    sl_zip: string;
    sl_latitude: string;
    sl_longitude: string;
    sl_tags: string;
    sl_phone: string;
    Polizeipräsidium: string;
  }
  
  // Typen für verarbeitete Polizeidaten
  export interface PolizeiStation {
    id: string;
    name: string;
    typ: 'praesidium' | 'revier';
    adresse: string;
    plz: string;
    ort: string;
    bundesland: string;
    latitude: number;
    longitude: number;
    telefon?: string;
    parentId?: string; // Für Hierarchie (Revier → Präsidium)
  }
  
  // CSV-Parser-Funktion
  export function parsePolizeiDaten(csvText: string): PolizeiStation[] {
    const zeilen = csvText.trim().split('\n');
    const stationen: PolizeiStation[] = [];
    
    // Header überspringen (erste Zeile)
    for (let i = 1; i < zeilen.length; i++) {
      const spalten = zeilen[i].split(',');
      
      // CSV-Spalten zuordnen
      const rohdaten: PolizeiCsvDaten = {
        sl_store: spalten[0] || '',
        sl_address: spalten[1] || '',
        sl_city: spalten[2] || '',
        sl_zip: spalten[3] || '',
        sl_latitude: spalten[4] || '',
        sl_longitude: spalten[5] || '',
        sl_tags: spalten[6] || '',
        sl_phone: spalten[7] || '',
        Polizeipräsidium: spalten[8] || ''
      };
      
      // Nur relevante Stationen verarbeiten
      if (istRelevant(rohdaten)) {
        const station = verarbeiteStation(rohdaten, i);
        if (station) {
          stationen.push(station);
        }
      }
    }
    
    return stationen;
  }
  
  // Prüft, ob eine Station relevant ist (Baden-Württemberg + richtige Typen)
  function istRelevant(daten: PolizeiCsvDaten): boolean {
    const istPolizeirevier = daten.sl_tags === 'Polizeirevier';
    const istPolizeipraesidium = daten.sl_tags === 'Polizeipräsidium';
    
    // Ausschließen: Posten, Hochschulen, etc.
    const sollAusschliessen = 
      daten.sl_store.includes('Polizeiposten') ||
      daten.sl_store.includes('Hochschule für Polizei') ||
      daten.sl_store.includes('Kriminalinspektionen') ||
      daten.sl_store.includes('Wasserschutzpolizei') ||
      daten.sl_store.includes('Landeskriminalamt');
      
    return (istPolizeirevier || istPolizeipraesidium) && !sollAusschliessen;
  }
  
  // Verarbeitet eine CSV-Zeile zu einer PolizeiStation
  function verarbeiteStation(daten: PolizeiCsvDaten, index: number): PolizeiStation | null {
    const lat = parseFloat(daten.sl_latitude);
    const lng = parseFloat(daten.sl_longitude);
    
    // Ungültige Koordinaten überspringen
    if (isNaN(lat) || isNaN(lng)) {
      console.warn(`Ungültige Koordinaten für ${daten.sl_store}`);
      return null;
    }
    
    const station: PolizeiStation = {
      id: `station-${index}`,
      name: daten.sl_store,
      typ: daten.sl_tags === 'Polizeipräsidium' ? 'praesidium' : 'revier',
      adresse: daten.sl_address,
      plz: daten.sl_zip,
      ort: daten.sl_city,
      bundesland: 'Baden-Württemberg', // Daten sind bereits gefiltert
      latitude: lat,
      longitude: lng,
      telefon: daten.sl_phone || undefined,
      parentId: daten.sl_tags === 'Polizeirevier' ? daten.Polizeipräsidium : undefined
    };
    
    return station;
  }
  
  // Hierarchie aufbauen (Präsidium → Reviere)
  export function buildHierarchy(stationen: PolizeiStation[]): Map<string, PolizeiStation[]> {
    const hierarchie = new Map<string, PolizeiStation[]>();
    
    // Alle Präsidien finden
    const praesidien = stationen.filter(s => s.typ === 'praesidium');
    
    praesidien.forEach(praesidium => {
      // Alle Reviere für dieses Präsidium finden
      const reviere = stationen.filter(s => 
        s.typ === 'revier' && s.parentId === praesidium.name
      );
      
      hierarchie.set(praesidium.id, [praesidium, ...reviere]);
    });
    
    return hierarchie;
  }
  
  // Nur Baden-Württemberg Stationen filtern
  export function filterBadenWuerttemberg(stationen: PolizeiStation[]): PolizeiStation[] {
    return stationen.filter(station => station.bundesland === 'Baden-Württemberg');
  }
  
  // Stationen nach Typ gruppieren
  export function groupByTyp(stationen: PolizeiStation[]): {
    praesidien: PolizeiStation[];
    reviere: PolizeiStation[];
  } {
    return {
      praesidien: stationen.filter(s => s.typ === 'praesidium'),
      reviere: stationen.filter(s => s.typ === 'revier')
    };
  }
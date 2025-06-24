import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { parsePolizeiDaten, buildHierarchy, filterBadenWuerttemberg, groupByTyp, type PolizeiStation } from '../../daten/polizeiDatenVerarbeitung'

function Step2Component() {
  const [selectedStations, setSelectedStations] = useState<string[]>([])
  const [stationen, setStationen] = useState<PolizeiStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  
  // Polizeidaten beim Komponenten-Start laden
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // CSV-Datei laden
        const response = await fetch('/daten/polizei-adressen.csv')
        if (!response.ok) {
          throw new Error('CSV-Datei konnte nicht geladen werden')
        }
        
        const csvText = await response.text()
        
        // CSV parsen und verarbeiten
        const alleStationen = parsePolizeiDaten(csvText)
        const bwStationen = filterBadenWuerttemberg(alleStationen)
        
        setStationen(bwStationen)
        
        console.log(`✅ ${bwStationen.length} Polizeistationen aus Baden-Württemberg geladen`)
        
      } catch (err) {
        console.error('Fehler beim Laden der Polizeidaten:', err)
        setError('Polizeidaten konnten nicht geladen werden')
        
        // Fallback: Mock-Daten verwenden
        const mockStationen: PolizeiStation[] = [
          {
            id: 'mock-1',
            name: 'Polizeipräsidium Stuttgart',
            typ: 'praesidium',
            adresse: 'Heslacher Tunnel 1',
            plz: '70372',
            ort: 'Stuttgart',
            bundesland: 'Baden-Württemberg',
            latitude: 48.777,
            longitude: 9.180
          }
        ]
        setStationen(mockStationen)
        
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Checkbox-Handler
  const handleStationToggle = (stationId: string) => {
    setSelectedStations(prev => 
      prev.includes(stationId) 
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    )
  }
  
  // Weiter zu Schritt 3
  const handleWeiter = () => {
    if (selectedStations.length === 0) {
      alert('Bitte wählen Sie mindestens eine Polizeistation aus!')
      return
    }
    
    console.log('Ausgewählte Stationen:', selectedStations)
    navigate({ to: '/wizard/step3' })
  }
  
  // Gruppiere Stationen nach Typ
  const gruppiertStationen = groupByTyp(stationen)
  
  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Schritt 2: Zielauswahl</h2>
        <div className="text-center py-8">
          <div className="animate-pulse">📡 Lade Polizeidaten...</div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Schritt 2: Zielauswahl</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ⚠️ {error}
        </div>
        <p className="text-sm text-gray-600">Mock-Daten werden verwendet.</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Schritt 2: Zielauswahl</h2>
      
      <div className="mb-4 text-sm text-gray-600">
        📊 {stationen.length} Polizeistationen in Baden-Württemberg gefunden
        <br />
        🏛️ {gruppiertStationen.praesidien.length} Präsidien, 
        🚔 {gruppiertStationen.reviere.length} Reviere
      </div>
      
      {/* Präsidien anzeigen */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🏛️ Polizeipräsidien</h3>
        <div className="space-y-2">
          {gruppiertStationen.praesidien.map(station => (
            <label 
              key={station.id} 
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input 
                type="checkbox" 
                className="w-4 h-4"
                checked={selectedStations.includes(station.id)}
                onChange={() => handleStationToggle(station.id)}
              />
              <div className="flex-1">
                <div className="font-medium">{station.name}</div>
                <div className="text-sm text-gray-500">
                  📍 {station.adresse}, {station.plz} {station.ort}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Reviere anzeigen */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🚔 Polizeireviere</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {gruppiertStationen.reviere.map(station => (
            <label 
              key={station.id} 
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input 
                type="checkbox" 
                className="w-4 h-4"
                checked={selectedStations.includes(station.id)}
                onChange={() => handleStationToggle(station.id)}
              />
              <div className="flex-1">
                <div className="font-medium">{station.name}</div>
                <div className="text-sm text-gray-500">
                  📍 {station.adresse}, {station.plz} {station.ort}
                  {station.telefon && <span> • ☎️ {station.telefon}</span>}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Auswahl-Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        ✅ {selectedStations.length} Stationen ausgewählt
      </div>
      
      {/* Navigation */}
      <div className="flex gap-3">
        <button 
          onClick={() => navigate({ to: '/wizard/step1' })}
          className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
        >
          ← Zurück
        </button>
        <button 
          onClick={handleWeiter}
          className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          disabled={selectedStations.length === 0}
        >
          Routen berechnen →
        </button>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/wizard/step2')({
  component: Step2Component,
})
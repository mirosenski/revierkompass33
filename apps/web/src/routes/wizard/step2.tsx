import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

function Step2Component() {
  const [selectedStations, setSelectedStations] = useState<string[]>([])
  
  const mockStations = [
    'Polizeipräsidium Stuttgart',
    'Polizeirevier Stuttgart-Mitte', 
    'Polizeirevier Stuttgart-Nord',
    'Polizeirevier Stuttgart-Süd'
  ]
  
  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Schritt 2: Zielauswahl</h2>
      <div className="space-y-3">
        {mockStations.map(station => (
          <label key={station} className="flex items-center space-x-3 p-3 border rounded-lg">
            <input type="checkbox" className="w-4 h-4" />
            <span>{station}</span>
          </label>
        ))}
        <button className="w-full bg-green-600 text-white p-3 rounded-lg mt-4">
          Routen berechnen
        </button>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/wizard/step2')({
  component: Step2Component,
})

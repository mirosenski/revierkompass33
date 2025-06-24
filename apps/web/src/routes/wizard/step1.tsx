import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { searchAddress, GeocodeResult, ADDRESS_SEARCH_CONFIG } from '../../services/adressSuche'

function Step1Component() {
  const [address, setAddress] = useState('')
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchStats, setSearchStats] = useState<{duration: number, cached: boolean} | null>(null)
  const navigate = useNavigate();
  
  // Optimierter Debounce für API-Anfragen
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (address.length >= 3) {
        setIsLoading(true)
        setError(null)
        setSearchStats(null)
        
        try {
          const startTime = performance.now()
          const results = await searchAddress(address)
          const endTime = performance.now()
          
          setSuggestions(results)
          setShowSuggestions(true)
          
          // Performance-Statistiken sammeln
          setSearchStats({
            duration: endTime - startTime,
            cached: results.length > 0 && endTime - startTime < 100 // Sehr schnelle Antwort deutet auf Cache hin
          })
          
        } catch (err) {
          setError('Fehler bei der Adressuche. Bitte versuchen Sie es erneut.')
          setSuggestions([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
        setSearchStats(null)
      }
    }, ADDRESS_SEARCH_CONFIG.DEBOUNCE_DELAY) // Verwendet konfigurierbaren Debounce

    return () => clearTimeout(debounceTimer)
  }, [address])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddress(value)
    // Nur bei aktiver Eingabe Suggestions zeigen
    if (value.length >= 3) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: GeocodeResult) => {
    // 1. State aktualisieren
    setAddress(suggestion.display_name)
    setSuggestions([])
    setShowSuggestions(false) // ❗ Dropdown explizit schließen
    setSearchStats(null)
    
    // 2. Fokus-Management mit setTimeout um React-Update abzuwarten
    setTimeout(() => {
      const weiterBtn = document.getElementById('weiter-btn')
      if (weiterBtn) {
        weiterBtn.focus()
        // Optional: Visuelles Feedback
        weiterBtn.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2')
        setTimeout(() => {
          weiterBtn.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2')
        }, 1000)
      }
    }, 0) // Sofort ausführen nach State-Update
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest('.suggestions-container')) {
      return
    }
    setTimeout(() => setShowSuggestions(false), 100)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">⚠️</div>
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Schritt 1 von 3</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">33%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📍</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Startadresse eingeben
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Geben Sie Ihre Startadresse ein, um Ihr Revier zu definieren.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ihre Adresse
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="z.B. Königstraße 1, Stuttgart..."
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         dark:focus:ring-blue-400 dark:focus:border-blue-400
                         transition-colors bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              )}
              
              {/* Performance-Statistiken */}
              {searchStats && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {searchStats.cached ? (
                    <span className="text-green-600 dark:text-green-400">💾 Aus Cache ({searchStats.duration.toFixed(0)}ms)</span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400">⚡ Live-Suche ({searchStats.duration.toFixed(0)}ms)</span>
                  )}
                </div>
              )}
              
              {/* Vorschläge anzeigen */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-container absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 
                              dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSuggestionClick(suggestion)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                               transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{suggestion.display_name}</div>
                      {suggestion.address.city && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.address.city}</div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {suggestion.source === 'nominatim' ? '🗺️ OpenStreetMap' : '🔍 Photon'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Keine Ergebnisse */}
              {showSuggestions && suggestions.length === 0 && address.length >= 3 && !isLoading && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 
                              dark:border-gray-700 rounded-lg shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
                  Keine Adressen gefunden
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Link 
                to="/"
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 
                         text-gray-700 dark:text-gray-300 font-medium rounded-lg 
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
              >
                Zurück
              </Link>
              <button 
                id="weiter-btn"
                onClick={() => {
                  if (!address.trim()) return
                  navigate({ to: '/wizard/step2' })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && address.trim()) {
                    navigate({ to: '/wizard/step2' })
                  }
                }}
                disabled={!address.trim()}
                className="flex-1 bg-blue-600 dark:bg-blue-800 text-white p-4 rounded-lg 
                         hover:bg-blue-700 dark:hover:bg-blue-700 
                         disabled:bg-gray-300 dark:disabled:bg-gray-600 
                         disabled:cursor-not-allowed transition-all duration-200 font-medium
                         focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Weiter zu Schritt 2
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/wizard/step1')({
  component: Step1Component,
})

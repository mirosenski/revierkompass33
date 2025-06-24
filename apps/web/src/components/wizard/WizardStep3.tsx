import { useState, useEffect } from 'react'
import { getOptimalRoute, type DetailedRouteResult } from '../../services/routing'
import { Button } from '../ui/button'
import { Loader2, MapPin, Clock, Route } from 'lucide-react'

// Mock toast function until proper toast component is available
const toast = ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
  console.log(`[${variant?.toUpperCase() || 'INFO'}] ${title}: ${description}`)
}

// Simple Card component since card.tsx doesn't exist
const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`border rounded-lg p-4 ${className || ''}`} onClick={onClick}>
    {children}
  </div>
)

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className || ''}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`font-semibold text-lg ${className || ''}`}>
    {children}
  </h3>
)

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className || ''}>
    {children}
  </div>
)

interface RouteCardProps {
  route: DetailedRouteResult
  onSelect: (route: DetailedRouteResult) => void
}

function RouteCard({ route, onSelect }: RouteCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSelect(route)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{route.name}</span>
          <div className="flex items-center text-xs text-muted-foreground">
            <Route className="w-3 h-3 mr-1" />
            {route.provider}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-sm">{route.distance.toFixed(1)} km</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-green-500" />
            <span className="text-sm">{route.duration} min</span>
          </div>
        </div>
        
        {/* Provider status indicator */}
        <div className="flex items-center justify-between">
          <div className={`px-2 py-1 rounded-full text-xs ${
            route.provider === 'osrm' ? 'bg-green-100 text-green-800' :
            route.provider === 'valhalla' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {route.provider === 'osrm' ? 'OSRM (Fast)' :
             route.provider === 'valhalla' ? 'Valhalla (Traffic-aware)' :
             'Direct Route (Estimated)'}
          </div>
          
          {route.traffic_aware && (
            <span className="text-xs text-green-600 font-medium">Live Traffic</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface Revier {
  id: string
  name: string
  coordinates: [number, number]
}

interface StartLocation {
  lng: number
  lat: number
}

interface WizardStep3Props {
  startLocation?: StartLocation
  selectedReviere: Revier[]
  onRoutesCalculated?: (routes: DetailedRouteResult[]) => void
  onNextStep?: () => void
}

export function WizardStep3({ startLocation, selectedReviere, onRoutesCalculated, onNextStep }: WizardStep3Props) {
  const [loading, setLoading] = useState(false)
  const [routes, setLocalRoutes] = useState<DetailedRouteResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<DetailedRouteResult | null>(null)

  // Calculate routes when component mounts
  useEffect(() => {
    if (startLocation && selectedReviere.length > 0) {
      calculateRoutes()
    }
  }, [startLocation, selectedReviere])

  const calculateRoutes = async () => {
    if (!startLocation) {
      setError('Startadresse ist erforderlich')
      return
    }

    setLoading(true)
    setError(null)
    setLocalRoutes([])

    try {
      // Convert your existing coordinate format to new format
      const startCoords: [number, number] = [startLocation.lng, startLocation.lat]
      
      // Calculate routes to all selected Reviere in parallel
      const routePromises = selectedReviere.map(async (revier: Revier) => {
        try {
          const destCoords: [number, number] = [revier.coordinates[0], revier.coordinates[1]]
          const route = await getOptimalRoute(startCoords, destCoords)
          
          // Enhance route with Revier information
          return {
            ...route,
            name: revier.name,
            id: revier.id,
            revierId: revier.id
          }
        } catch (error) {
          console.warn(`Route calculation failed for ${revier.name}:`, error)
          
          // Return fallback route even if calculation fails
          if (error instanceof Error && error.name === 'InvalidCoordinateError') {
            throw error // Re-throw coordinate errors
          }
          
          // For other errors, return a basic route
          return {
            id: `fallback-${revier.id}`,
            name: revier.name,
            distance: 0,
            duration: 0,
            geometry: {
              type: 'LineString' as const,
              coordinates: [startCoords, [revier.coordinates[0], revier.coordinates[1]]]
            },
            instructions: [],
            provider: 'fallback' as const,
            traffic_aware: false,
            alternative_routes: [],
            revierId: revier.id
          }
        }
      })

      const calculatedRoutes = await Promise.all(routePromises)
      
      // Sort routes by distance (closest first)
      const sortedRoutes = calculatedRoutes.sort((a: DetailedRouteResult, b: DetailedRouteResult) => a.distance - b.distance)
      
      setLocalRoutes(sortedRoutes)
      
      // Notify parent component
      onRoutesCalculated?.(sortedRoutes)
      
      // Show success toast with provider statistics
      const providers = sortedRoutes.reduce((acc: Record<string, number>, route: DetailedRouteResult) => {
        acc[route.provider] = (acc[route.provider] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const providerSummary = Object.entries(providers)
        .map(([provider, count]) => `${count} via ${provider}`)
        .join(', ')
      
      toast({
        title: 'Routen berechnet',
        description: `${sortedRoutes.length} Routen erfolgreich berechnet (${providerSummary})`,
        variant: 'success'
      })

    } catch (error) {
      console.error('Route calculation error:', error)
      
      if (error instanceof Error && error.name === 'InvalidCoordinateError') {
        setError('Ungültige Koordinaten. Bitte überprüfen Sie Ihre Eingaben.')
        toast({
          title: 'Koordinatenfehler',
          description: 'Die eingegebenen Koordinaten sind ungültig.',
          variant: 'destructive'
        })
      } else {
        setError('Routenberechnung fehlgeschlagen. Bitte versuchen Sie es erneut.')
        toast({
          title: 'Routenberechnung fehlgeschlagen',
          description: 'Es gab ein Problem bei der Berechnung der Routen.',
          variant: 'destructive'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRouteSelect = (route: DetailedRouteResult) => {
    setSelectedRoute(route)
    
    toast({
      title: 'Route ausgewählt',
      description: `${route.name} - ${route.distance.toFixed(1)} km, ${route.duration} min`,
      variant: 'success'
    })
  }

  const handleContinue = () => {
    if (!selectedRoute) {
      toast({
        title: 'Keine Route ausgewählt',
        description: 'Bitte wählen Sie eine Route aus.',
        variant: 'destructive'
      })
      return
    }

    onNextStep?.()
  }

  const handleRecalculate = () => {
    calculateRoutes()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <h3 className="text-lg font-semibold mb-2">Routen werden berechnet...</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Wir berechnen die optimalen Routen zu den ausgewählten Polizeistationen. 
          Dies kann einen Moment dauern.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 mb-4">
          <MapPin className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-red-600">Routenberechnung fehlgeschlagen</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">{error}</p>
        <Button onClick={handleRecalculate} variant="outline">
          Erneut versuchen
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Routen auswählen</h2>
        <p className="text-muted-foreground">
          Wählen Sie die beste Route zu Ihrem Ziel aus den berechneten Optionen.
        </p>
      </div>

      {routes.length > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Berechnete Routen: {routes.length}</span>
            <Button onClick={handleRecalculate} variant="ghost" size="sm">
              Neu berechnen
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Sortiert nach Entfernung • Kürzeste Route zuerst
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            onSelect={handleRouteSelect}
          />
        ))}
      </div>

      {selectedRoute && (
        <div className="border-t pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-800 mb-1">Route ausgewählt</h4>
            <p className="text-green-700">
              {selectedRoute.name} - {selectedRoute.distance.toFixed(1)} km, {selectedRoute.duration} min
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setSelectedRoute(null)}>
              Andere Route wählen
            </Button>
            <Button onClick={handleContinue}>
              Weiter zur Übersicht
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 
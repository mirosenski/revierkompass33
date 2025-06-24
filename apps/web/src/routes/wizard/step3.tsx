import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { getOptimalRoute, type LatLng, type RouteResult } from "@/services/routing";
import type { PolizeiStation } from "@/daten/polizeiDatenVerarbeitung";

interface StationResult {
  station: string;
  distance: string;
  duration: string;
  loading: boolean;
  error?: string;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Fehler beim Laden der Routen</h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
}

function Step3Component() {
  const { stations: stationsParam } = Route.useSearch();
  const [results, setResults] = useState<StationResult[]>([]);
  const [selectedStations, setSelectedStations] = useState<PolizeiStation[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Test coordinates for manual testing
  const testCoordinates = {
    stuttgart: { lat: 48.7758, lng: 9.1829 },
    karlsruhe: { lat: 49.0069, lng: 8.4037 },
  };

  // Parse stations from URL params
  useEffect(() => {
    try {
      if (stationsParam) {
        const parsedStations = JSON.parse(stationsParam) as PolizeiStation[];
        console.log("📋 Empfangene Stationen:", parsedStations);
        setSelectedStations(parsedStations);
        
        // Initialize results array
        setResults(parsedStations.map(station => ({
          station: station.name,
          distance: "",
          duration: "",
          loading: true,
        })));
      }
    } catch (error) {
      console.error("Fehler beim Parsen der Stationendaten:", error);
    }
  }, [stationsParam]);

  // Get user location (mock for now - in real app would use geolocation)
  useEffect(() => {
    // Mock user location - in production this would come from Step 1
    setUserLocation({ lat: 48.7758, lng: 9.1829 }); // Stuttgart center
  }, []);

  const testRoute = async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      console.log("🚀 Testing routing with coordinates:", testCoordinates);
      
      const startTime = performance.now();
      const route = await getOptimalRoute(testCoordinates.stuttgart, testCoordinates.karlsruhe);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      console.log("✅ Route calculated:", route);
      console.log(`⏱️  Response time: ${duration.toFixed(2)}ms`);
      
      setTestResult({
        ...route,
        responseTime: duration,
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMin: Math.round(route.duration / 60),
      });
    } catch (err) {
      console.error("❌ Routing error:", err);
      setTestResult({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setTestLoading(false);
    }
  };

  // Calculate routes for selected stations
  useEffect(() => {
    if (!userLocation || selectedStations.length === 0) return;

    const calculateRoutes = async () => {
      console.log("🔄 Berechne Routen für", selectedStations.length, "Stationen");
      
      const newResults = await Promise.all(
        selectedStations.map(async (station, index) => {
          try {
            const stationCoords: LatLng = {
              lat: station.latitude!,
              lng: station.longitude!
            };

            console.log(`📍 Berechne Route zu ${station.name}:`, stationCoords);
            
            const route = await getOptimalRoute(userLocation, stationCoords);
            
            return {
              station: station.name,
              distance: `${(route.distance / 1000).toFixed(1)} km`,
              duration: `${Math.round(route.duration / 60)} min`,
              loading: false,
            };
          } catch (error) {
            console.error(`❌ Fehler bei Route zu ${station.name}:`, error);
            return {
              station: station.name,
              distance: "",
              duration: "",
              loading: false,
              error: error instanceof Error ? error.message : "Unbekannter Fehler",
            };
          }
        })
      );

      setResults(newResults);
    };

    calculateRoutes();
  }, [userLocation, selectedStations]);

  if (selectedStations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Keine Stationen ausgewählt</h3>
          <p className="text-yellow-600 mb-4">
            Bitte gehen Sie zurück zu Schritt 2 und wählen Sie mindestens eine Polizeistation aus.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            ← Zurück zu Schritt 2
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Schritt 3: Routenergebnisse</h2>
      
      <div className="mb-4 text-sm text-gray-600">
        📍 Start: Stuttgart (48.7758, 9.1829) • 🎯 {selectedStations.length} Stationen ausgewählt
      </div>
      
      {/* Manual Test Section */}
      <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
        <h3 className="font-semibold mb-2">🧪 Manueller Test (Stuttgart → Karlsruhe)</h3>
        <div className="text-sm text-gray-600 mb-3">
          Start: 48.7758, 9.1829 | Ziel: 49.0069, 8.4037 | Erwartet: ~80 km / ~60 min
        </div>
        <button
          onClick={testRoute}
          disabled={testLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {testLoading ? "🔄 Teste..." : "🚀 Route testen"}
        </button>
        
        {testResult && (
          <div className="mt-3 p-3 bg-white border rounded">
            {testResult.error ? (
              <div className="text-red-600">❌ {testResult.error}</div>
            ) : (
              <div className="text-sm">
                <div>✅ {testResult.distanceKm} km / {testResult.durationMin} min</div>
                <div>⏱️ {testResult.responseTime.toFixed(2)}ms</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={result.station} className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold">{result.station}</h3>
            {result.loading ? (
              <LoadingSpinner />
            ) : result.error ? (
              <div className="text-red-600 text-sm mt-2">{result.error}</div>
            ) : (
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Entfernung: {result.distance}</span>
                <span>Dauer: {result.duration}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/wizard/step3")({
  component: () => (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Step3Component />
    </ErrorBoundary>
  ),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      stations: search.stations as string | undefined,
    };
  },
});

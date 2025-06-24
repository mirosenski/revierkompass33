import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import csvData from "../../daten/polizei-adressen.csv?raw";
import {
  buildHierarchy,
  filterBadenWuerttemberg,
  groupByTyp,
  type PolizeiStation,
  parsePolizeiDaten,
} from "../../daten/polizeiDatenVerarbeitung";

function Step2Component() {
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [stationen, setStationen] = useState<PolizeiStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPraesidien, setExpandedPraesidien] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Polizeidaten beim Komponenten-Start laden
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const alleStationen = parsePolizeiDaten(csvData);
        const bwStationen = filterBadenWuerttemberg(alleStationen);
        const _hierarchieMap = buildHierarchy(bwStationen);

        setStationen(bwStationen);

        console.log(`✅ ${bwStationen.length} Polizeistationen aus Baden-Württemberg geladen`);
      } catch (err) {
        console.error("Fehler beim Laden der Polizeidaten:", err);

        // Fallback: Mock-Daten
        const mockStationen: PolizeiStation[] = [
          {
            id: "mock-praesidium-1",
            name: "Polizeipräsidium Stuttgart",
            typ: "praesidium",
            adresse: "Heslacher Tunnel 1",
            plz: "70372",
            ort: "Stuttgart",
            bundesland: "Baden-Württemberg",
            latitude: 48.777,
            longitude: 9.18,
          },
          {
            id: "mock-revier-1",
            name: "Polizeirevier Stuttgart-Mitte",
            typ: "revier",
            adresse: "Königstraße 1",
            plz: "70173",
            ort: "Stuttgart",
            bundesland: "Baden-Württemberg",
            latitude: 48.776,
            longitude: 9.182,
            parentId: "Polizeipräsidium Stuttgart",
          },
        ];
        setStationen(mockStationen);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // KORRIGIERT: Hilfsfunktion für Reviere eines Präsidiums
  const getReviereForPraesidium = (praesidium: PolizeiStation): PolizeiStation[] => {
    // Präsidium-Kurzname extrahieren: "Polizeipräsidium Aalen" → "Aalen"
    const praesidiumKurzname = praesidium.name.replace("Polizeipräsidium ", "");

    return stationen.filter(
      (station) => station.typ === "revier" && station.parentId === praesidiumKurzname,
    );
  };

  // Präsidium-Handler: Wählt/abwählt Präsidium + alle zugehörigen Reviere
  const handlePraesidiumToggle = (praesidium: PolizeiStation) => {
    const reviere = getReviereForPraesidium(praesidium);
    const allIds = [praesidium.id, ...reviere.map((r) => r.id)];

    const isPraesidiumSelected = selectedStations.includes(praesidium.id);

    if (isPraesidiumSelected) {
      // Präsidium + alle Reviere abwählen
      setSelectedStations((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      // Präsidium + alle Reviere auswählen
      setSelectedStations((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  // Akkordeon-Handler: Öffnet/schließt Präsidium-Details
  const handlePraesidiumExpand = (praesidiumId: string) => {
    setExpandedPraesidien((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(praesidiumId)) {
        newSet.delete(praesidiumId);
      } else {
        newSet.add(praesidiumId);
      }
      return newSet;
    });
  };

  // Revier-Handler: Wählt/abwählt einzelnes Revier
  const handleRevierToggle = (revier: PolizeiStation) => {
    const isSelected = selectedStations.includes(revier.id);

    if (isSelected) {
      // Revier abwählen
      setSelectedStations((prev) => prev.filter((id) => id !== revier.id));
    } else {
      // Revier auswählen
      setSelectedStations((prev) => [...prev, revier.id]);
    }
  };

  // Prüft, ob ein Präsidium vollständig ausgewählt ist
  const isPraesidiumFullySelected = (praesidium: PolizeiStation): boolean => {
    const reviere = getReviereForPraesidium(praesidium);
    const allIds = [praesidium.id, ...reviere.map((r) => r.id)];
    return allIds.every((id) => selectedStations.includes(id));
  };

  // Prüft, ob ein Präsidium teilweise ausgewählt ist
  const isPraesidiumPartiallySelected = (praesidium: PolizeiStation): boolean => {
    const reviere = getReviereForPraesidium(praesidium);
    const allIds = [praesidium.id, ...reviere.map((r) => r.id)];
    return (
      allIds.some((id) => selectedStations.includes(id)) && !isPraesidiumFullySelected(praesidium)
    );
  };

  const handleWeiter = () => {
    if (selectedStations.length === 0) {
      alert("Bitte wählen Sie mindestens eine Polizeistation aus!");
      return;
    }

    console.log("Ausgewählte Stationen:", selectedStations);
    navigate({ to: "/wizard/step3" });
  };

  const gruppiertStationen = groupByTyp(stationen);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Schritt 2: Zielauswahl</h2>
        <div className="text-center py-8">
          <div className="animate-pulse">📡 Lade Polizeidaten...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Schritt 2: Zielauswahl</h2>

      <div className="mb-4 text-sm text-gray-600">
        📊 {stationen.length} Polizeistationen in Baden-Württemberg • 🏛️{" "}
        {gruppiertStationen.praesidien.length} Präsidien • 🚔 {gruppiertStationen.reviere.length}{" "}
        Reviere
      </div>

      {/* Hierarchische Darstellung - keine Scrollbar mehr */}
      <div className="border rounded-lg p-4 mb-6">
        <div className="space-y-3">
          {gruppiertStationen.praesidien.map((praesidium) => {
            const reviere = getReviereForPraesidium(praesidium);
            const isFullySelected = isPraesidiumFullySelected(praesidium);
            const isPartiallySelected = isPraesidiumPartiallySelected(praesidium);
            const isExpanded = expandedPraesidien.has(praesidium.id);

            return (
              <div key={praesidium.id} className="border rounded-lg">
                {/* Präsidium Header */}
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={isFullySelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartiallySelected && !isFullySelected;
                    }}
                    onChange={() => handlePraesidiumToggle(praesidium)}
                  />
                  <div className="flex-1">
                    <div className="font-bold text-blue-700">🏛️ {praesidium.name}</div>
                    <div className="text-sm text-gray-600">
                      📍 {praesidium.adresse}, {praesidium.plz} {praesidium.ort}
                      {praesidium.telefon && <span> • ☎️ {praesidium.telefon}</span>}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">{reviere.length} Reviere</div>
                  </div>
                  {/* Akkordeon-Button */}
                  {reviere.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePraesidiumExpand(praesidium.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title={isExpanded ? "Reviere ausblenden" : "Reviere anzeigen"}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  )}
                </div>

                {/* Reviere unter diesem Präsidium - Akkordeon */}
                {reviere.length > 0 && isExpanded && (
                  <div className="p-3 bg-gray-50 border-t">
                    <div className="space-y-2">
                      {reviere.map((revier) => (
                        <label
                          key={revier.id}
                          className="flex items-center space-x-3 p-2 border rounded cursor-pointer hover:bg-white transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={selectedStations.includes(revier.id)}
                            onChange={() => handleRevierToggle(revier)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">🚔 {revier.name}</div>
                            <div className="text-sm text-gray-500">
                              📍 {revier.adresse}, {revier.plz} {revier.ort}
                              {revier.telefon && <span> • ☎️ {revier.telefon}</span>}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Auswahl-Info */}
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        ✅ {selectedStations.length} Stationen ausgewählt
        {selectedStations.length > 0 && (
          <div className="text-sm text-green-700 mt-1">
            Gewählte IDs: {selectedStations.join(", ")}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/wizard/step1" })}
          className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
        >
          ← Zurück
        </button>
        <button
          type="button"
          onClick={handleWeiter}
          className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
          disabled={selectedStations.length === 0}
        >
          Routen berechnen →
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/wizard/step2")({
  component: Step2Component,
});

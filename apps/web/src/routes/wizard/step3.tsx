import { createFileRoute } from "@tanstack/react-router";

function Step3Component() {
  const mockResults = [
    { station: "Polizeirevier Stuttgart-Mitte", distance: "2.3 km", duration: "8 min" },
    { station: "Polizeirevier Stuttgart-Nord", distance: "4.1 km", duration: "12 min" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Schritt 3: Routenergebnisse</h2>
      <div className="space-y-4">
        {mockResults.map((result) => (
          <div key={result.station} className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="font-semibold">{result.station}</h3>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Entfernung: {result.distance}</span>
              <span>Dauer: {result.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/wizard/step3")({
  component: Step3Component,
});

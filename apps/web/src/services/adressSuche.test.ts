// Erweiterte Tests für die Adressuche-Funktionalität
import { searchAddress } from "./adressSuche";

// Test-Funktion für BW-Adressen
export async function testBWAddresses() {
  console.log("🧪 Teste Baden-Württemberg Adressen...");

  const testAddresses = [
    "Königstraße 1, Stuttgart",
    "Marktplatz, Karlsruhe",
    "Hauptbahnhof, Mannheim",
    "Schlossplatz, Heidelberg",
    "Münsterplatz, Freiburg",
    "Marktplatz, Ulm",
    "Schloss, Ludwigsburg",
    "Rathaus, Tübingen",
  ];

  for (const address of testAddresses) {
    console.log(`\n📍 Teste: "${address}"`);
    try {
      const startTime = performance.now();
      const results = await searchAddress(address);
      const endTime = performance.now();

      console.log(`⏱️  Dauer: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 Ergebnisse: ${results.length}`);

      results.slice(0, 3).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.display_name} (${result.source})`);
      });

      // Prüfe ob Ergebnisse in BW sind
      const bwResults = results.filter(
        (r) =>
          r.address.state?.includes("Baden") ||
          r.address.state?.includes("Württemberg") ||
          r.display_name.includes("Baden") ||
          r.display_name.includes("Württemberg") ||
          r.display_name.includes("Stuttgart") ||
          r.display_name.includes("Karlsruhe") ||
          r.display_name.includes("Mannheim") ||
          r.display_name.includes("Heidelberg") ||
          r.display_name.includes("Freiburg") ||
          r.display_name.includes("Ulm") ||
          r.display_name.includes("Ludwigsburg") ||
          r.display_name.includes("Tübingen"),
      );

      if (bwResults.length > 0) {
        console.log(`✅ BW-Ergebnisse gefunden: ${bwResults.length}`);
      } else {
        console.log(`⚠️  Keine spezifischen BW-Ergebnisse`);
      }
    } catch (error) {
      console.error(`❌ Fehler bei "${address}":`, error);
    }
  }
}

// Performance-Test
export async function testPerformance() {
  console.log("⚡ Performance-Test...");

  const testQuery = "Hauptbahnhof Stuttgart";
  const iterations = 5;

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`\n🔄 Iteration ${i + 1}/${iterations}`);

    const startTime = performance.now();
    const results = await searchAddress(testQuery);
    const endTime = performance.now();

    const duration = endTime - startTime;
    times.push(duration);

    console.log(`⏱️  Dauer: ${duration.toFixed(2)}ms`);
    console.log(`📊 Ergebnisse: ${results.length}`);

    // Warte zwischen Anfragen (Nominatim Limit: 2/s)
    if (i < iterations - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log("\n📈 Performance-Statistiken:");
  console.log(`📊 Durchschnitt: ${avgTime.toFixed(2)}ms`);
  console.log(`⚡ Minimum: ${minTime.toFixed(2)}ms`);
  console.log(`🐌 Maximum: ${maxTime.toFixed(2)}ms`);

  // Cache-Test
  console.log("\n💾 Cache-Test...");
  const cacheStartTime = performance.now();
  const _cachedResults = await searchAddress(testQuery);
  const cacheEndTime = performance.now();

  const cacheDuration = cacheEndTime - cacheStartTime;
  console.log(`⏱️  Cache-Dauer: ${cacheDuration.toFixed(2)}ms`);

  if (cacheDuration < avgTime * 0.5) {
    console.log("✅ Cache funktioniert!");
  } else {
    console.log("⚠️  Cache könnte optimiert werden");
  }
}

// Debounce-Test
export async function testDebounce() {
  console.log("⏱️  Debounce-Test...");

  const queries = ["St", "Stu", "Stut", "Stutt", "Stuttg", "Stuttga", "Stuttgart"];

  for (const query of queries) {
    console.log(`\n🔍 Teste: "${query}"`);
    const startTime = performance.now();
    const results = await searchAddress(query);
    const endTime = performance.now();

    console.log(`⏱️  Dauer: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 Ergebnisse: ${results.length}`);

    // Kurze Pause
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Haupttest-Funktion
export async function runAllTests() {
  console.log("🚀 Starte alle Adressuche-Tests...\n");

  try {
    await testBWAddresses();
    console.log(`\n${"=".repeat(50)}\n`);

    await testPerformance();
    console.log(`\n${"=".repeat(50)}\n`);

    await testDebounce();

    console.log("\n✅ Alle Tests abgeschlossen!");
  } catch (error) {
    console.error("❌ Test-Suite fehlgeschlagen:", error);
  }
}

// Test ausführen, wenn diese Datei direkt aufgerufen wird
if (typeof window !== "undefined") {
  // Im Browser: Test-Funktionen global verfügbar machen
  (window as unknown as Window & { testBWAddresses: typeof testBWAddresses }).testBWAddresses =
    testBWAddresses;
  (window as unknown as Window & { testPerformance: typeof testPerformance }).testPerformance =
    testPerformance;
  (window as unknown as Window & { testDebounce: typeof testDebounce }).testDebounce = testDebounce;
  (window as unknown as Window & { runAllTests: typeof runAllTests }).runAllTests = runAllTests;

  console.log("🧪 Adressuche-Tests verfügbar:");
  console.log("- window.testBWAddresses()");
  console.log("- window.testPerformance()");
  console.log("- window.testDebounce()");
  console.log("- window.runAllTests()");
}

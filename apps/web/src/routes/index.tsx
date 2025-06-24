import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Willkommen beim Revierkompass!
          </h1>
          <p className="text-xl text-gray-600">
            Hier finden Sie alles rund um Ihr Revier.
          </p>
        </div>

        {/* Wizard Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Revier-Setup Wizard
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link 
              to="/wizard/step1"
              className="block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-3xl mb-3">📍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schritt 1</h3>
              <p className="text-gray-600">Startadresse eingeben</p>
            </Link>
            
            <Link 
              to="/wizard/step2"
              className="block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schritt 2</h3>
              <p className="text-gray-600">Revier-Größe definieren</p>
            </Link>
            
            <Link 
              to="/wizard/step3"
              className="block p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="text-3xl mb-3">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schritt 3</h3>
              <p className="text-gray-600">Konfiguration abschließen</p>
            </Link>
          </div>
        </div>

        {/* Quick Start Button */}
        <div className="text-center">
          <Link 
            to="/wizard/step1"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            🚀 Wizard starten
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
} 
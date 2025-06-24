import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

function Step1Component() {
  const [address, setAddress] = useState('')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Schritt 1 von 3</span>
            <span className="text-sm text-gray-500">33%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }}></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Startadresse eingeben
            </h2>
            <p className="text-gray-600">
              Geben Sie Ihre Startadresse ein, um Ihr Revier zu definieren.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Ihre Adresse
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="z.B. Musterstraße 123, 12345 Musterstadt"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex space-x-4">
              <Link 
                to="/"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Zurück
              </Link>
              <Link 
                to="/wizard/step2"
                className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors text-center ${
                  address.trim() 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!address.trim()) {
                    e.preventDefault()
                  }
                }}
              >
                Weiter
              </Link>
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

import { createFileRoute, Link } from '@tanstack/react-router'
import { useTheme } from '../components/theme-provider'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Willkommen bei RevierKompass
          </h1>
          
          {/* Dark Mode Test */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Theme Test</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Aktuelles Theme: <span className="font-medium text-gray-900 dark:text-white">{theme}</span>
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => setTheme('light')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Light Mode
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Dark Mode
              </button>
              <button 
                onClick={() => setTheme('system')}
                className="w-full bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
              >
                System
              </button>
            </div>
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Entdecken Sie Ihr perfektes Revier mit unserem intelligenten Wizard.
          </p>
          
          <div className="space-x-4">
            <Link 
              to="/wizard/step1" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Wizard starten
            </Link>
            <Link 
              to="/about" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors inline-block"
            >
              Über uns
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
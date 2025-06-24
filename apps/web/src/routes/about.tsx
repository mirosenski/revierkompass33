import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Über RevierKompass
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Ihre zuverlässige Anwendung für die optimale Routenplanung.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Was ist RevierKompass?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            RevierKompass ist eine moderne Webanwendung, die Ihnen dabei hilft, 
            schnell und einfach den optimalen Weg zu Polizeistationen in Baden-Württemberg zu finden.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Unsere Mission
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Wir möchten die Navigation zu wichtigen Einrichtungen so einfach und 
            benutzerfreundlich wie möglich gestalten.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Technologie
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Entwickelt mit modernsten Webtechnologien wie React, TypeScript und Tailwind CSS 
            für eine optimale Benutzererfahrung.
          </p>
        </div>
      </div>
    </div>
  )
} 
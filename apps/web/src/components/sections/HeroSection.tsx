import { Link } from '@tanstack/react-router'

export function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-blue-600 dark:from-blue-800 to-indigo-700 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Revierkompass
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 dark:text-blue-200 mb-8 max-w-3xl mx-auto">
            Finden Sie schnell und einfach den optimalen Weg zu Polizeistationen 
            in Baden-Württemberg
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/wizard/step1"
              className="bg-background text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent transition-colors"
            >
              Jetzt Route planen
            </Link>
            <Link
              to="/about"
              className="border-2 border-foreground text-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-background hover:text-primary transition-colors"
            >
              Mehr erfahren
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
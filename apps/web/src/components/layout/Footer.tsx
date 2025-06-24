export function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RK</span>
              </div>
              <span className="text-xl font-bold">RevierKompass</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 max-w-md">
              Ihre zuverlässige Anwendung für die optimale Routenplanung zu Polizeistationen in
              Baden-Württemberg.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 dark:text-gray-500 hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/wizard/step1"
                  className="text-gray-400 dark:text-gray-500 hover:text-white"
                >
                  Route planen
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-400 dark:text-gray-500 hover:text-white">
                  Über uns
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
            <ul className="space-y-2">
              <li className="text-gray-400 dark:text-gray-500">Baden-Württemberg</li>
              <li className="text-gray-400 dark:text-gray-500">Deutschland</li>
              <li>
                <a
                  href="mailto:info@revierkompass.de"
                  className="text-gray-400 dark:text-gray-500 hover:text-white"
                >
                  info@revierkompass.de
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 dark:text-gray-500">
            © 2025 RevierKompass. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useId } from "react";

export const Route = createFileRoute("/login")({
  component: Login,
});

export default function Login() {
  const emailId = useId();
  const passwordId = useId();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Anmelden</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Melden Sie sich in Ihrem RevierKompass-Konto an.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form className="space-y-6">
            <div>
              <label
                htmlFor={emailId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                E-Mail
              </label>
              <input
                type="email"
                id={emailId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="ihre@email.de"
              />
            </div>

            <div>
              <label
                htmlFor={passwordId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Passwort
              </label>
              <input
                type="password"
                id={passwordId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 dark:bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors"
            >
              Anmelden
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Noch kein Konto?{" "}
              <a href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                Registrieren
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

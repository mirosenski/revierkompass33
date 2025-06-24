module.exports = {
  darkMode: 'class', // Aktiviert manuellen Dark Mode via .dark-Klasse
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Hellblau
          dark: '#1d4ed8'     // Dunkelblau
        },
        background: {
          DEFAULT: '#f9fafb', // Hellgrau
          dark: '#1a1a1a'     // Dunkelgrau
        }
      }
    },
  },
  plugins: [],
} 
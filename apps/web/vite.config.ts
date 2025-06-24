import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  assetsInclude: ["**/*.csv"],
});

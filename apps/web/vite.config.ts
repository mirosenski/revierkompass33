import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'openstreetmap-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/router\.project-osrm\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'osrm-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'maplibre-gl',
      'zustand'
    ]
  },

  // Development server configuration
  server: {
    port: 5173,
    host: true,
    
    // Proxy configuration to avoid CORS issues during development
    proxy: {
      // Proxy requests to Valhalla API
      '/api/valhalla': {
        target: 'https://valhalla1.openstreetmap.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/valhalla/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Valhalla proxy error', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Valhalla proxy request:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Valhalla proxy response:', proxyRes.statusCode, req.url)
          })
        }
      },
      
      // Proxy requests to OSRM API (fallback endpoints)
      '/api/osrm': {
        target: 'https://router.project-osrm.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/osrm/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('OSRM proxy error', err)
          })
        }
      },
      
      // Proxy for alternative OSRM endpoints
      '/api/osrm-de': {
        target: 'https://routing.openstreetmap.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/osrm-de/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('OSRM DE proxy error', err)
          })
        }
      },
      
      // Proxy for Nominatim geocoding
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Nominatim proxy error', err)
          })
        }
      }
    },

    // CORS headers for development
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    cssCodeSplit: true,
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor': ['react', 'react-dom'],
          'router': ['@tanstack/react-router'],
          'query': ['@tanstack/react-query'],
          'map': ['maplibre-gl'],
          'ui': ['lucide-react', 'framer-motion']
        }
      }
    },
    
    // Minification options
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },

  // Environment variables
  envPrefix: 'VITE_',
  
  // CSS configuration
  css: {
    devSourcemap: true
  },

  // Include CSV files as assets
  assetsInclude: ["**/*.csv"]
})

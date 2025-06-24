import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { 
  getOptimalRoute, 
  type DetailedRouteResult, 
  type Coordinates 
} from '../services/routing'
import { routeCache } from '../services/routing/cache'

interface RouteRequest {
  id: string
  origin: Coordinates
  destination: Coordinates
  timestamp: number
  status: 'pending' | 'success' | 'error'
}

interface RoutingState {
  // Route data
  routes: DetailedRouteResult[]
  currentRoute: DetailedRouteResult | null
  
  // Request tracking
  activeRequests: RouteRequest[]
  requestHistory: RouteRequest[]
  
  // UI state
  isCalculating: boolean
  error: string | null
  
  // Performance metrics
  cacheStats: {
    hits: number
    misses: number
    hitRate: number
  }
  
  // Provider statistics
  providerStats: {
    osrm: number
    valhalla: number
    fallback: number
  }
}

interface RoutingActions {
  // Route calculation
  calculateRoute: (origin: Coordinates, destination: Coordinates, options?: {
    priority?: 'speed' | 'accuracy'
    timeout?: number
  }) => Promise<DetailedRouteResult>
  
  calculateMultipleRoutes: (
    origin: Coordinates, 
    destinations: Array<{ coordinates: Coordinates; name: string; id: string }>
  ) => Promise<DetailedRouteResult[]>
  
  // Route management
  setCurrentRoute: (route: DetailedRouteResult | null) => void
  addRoute: (route: DetailedRouteResult) => void
  removeRoute: (routeId: string) => void
  clearRoutes: () => void
  
  // Error handling
  setError: (error: string | null) => void
  clearError: () => void
  
  // Performance monitoring
  updateCacheStats: () => void
  resetStats: () => void
  
  // Request management
  cancelAllRequests: () => void
  retryFailedRequests: () => Promise<void>
}

type RoutingStore = RoutingState & RoutingActions

// Create abort controller for request cancellation
let globalAbortController = new AbortController()

export const useRoutingStore = create<RoutingStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        routes: [],
        currentRoute: null,
        activeRequests: [],
        requestHistory: [],
        isCalculating: false,
        error: null,
        cacheStats: {
          hits: 0,
          misses: 0,
          hitRate: 0
        },
        providerStats: {
          osrm: 0,
          valhalla: 0,
          fallback: 0
        },

        // Actions
        calculateRoute: async (origin, destination, options = {}) => {
          const requestId = crypto.randomUUID()
          const request: RouteRequest = {
            id: requestId,
            origin,
            destination,
            timestamp: Date.now(),
            status: 'pending'
          }

          set((state) => {
            state.activeRequests.push(request)
            state.isCalculating = true
            state.error = null
          })

          try {
            // Check if request should be cancelled
            if (globalAbortController.signal.aborted) {
              throw new Error('Request cancelled')
            }

            const route = await getOptimalRoute(origin, destination)

            set((state) => {
              // Update request status
              const activeRequest = state.activeRequests.find((r: RouteRequest) => r.id === requestId)
              if (activeRequest) {
                activeRequest.status = 'success'
              }

              // Move to history
              state.requestHistory.push({
                ...request,
                status: 'success'
              })

              // Update provider statistics
              state.providerStats[route.provider]++

              // Add route to collection
              state.routes.push(route)

              // Clear loading state
              state.isCalculating = state.activeRequests.some((r: RouteRequest) => r.status === 'pending')
            })

            // Update cache statistics
            get().updateCacheStats()

            return route

          } catch (error) {
            set((state) => {
              // Update request status
              const activeRequest = state.activeRequests.find((r: RouteRequest) => r.id === requestId)
              if (activeRequest) {
                activeRequest.status = 'error'
              }

              // Move to history
              state.requestHistory.push({
                ...request,
                status: 'error'
              })

              // Set error message
              if (error instanceof Error && error.name === 'InvalidCoordinateError') {
                state.error = 'Ungültige Koordinaten eingegeben'
              } else if (error instanceof Error) {
                state.error = error.message
              } else {
                state.error = 'Unbekannter Fehler bei der Routenberechnung'
              }

              // Clear loading state
              state.isCalculating = state.activeRequests.some((r: RouteRequest) => r.status === 'pending')
            })

            throw error
          } finally {
            set((state) => {
              // Remove from active requests
              state.activeRequests = state.activeRequests.filter((r: RouteRequest) => r.id !== requestId)
            })
          }
        },

        calculateMultipleRoutes: async (origin, destinations) => {
          set((state) => {
            state.isCalculating = true
            state.error = null
          })

          const results: DetailedRouteResult[] = []
          const errors: string[] = []

          try {
            // Process in batches to avoid overwhelming the APIs
            const batchSize = 3
            for (let i = 0; i < destinations.length; i += batchSize) {
              const batch = destinations.slice(i, i + batchSize)
              
              const batchPromises = batch.map(async (dest) => {
                try {
                  const route = await get().calculateRoute(origin, dest.coordinates)
                  return {
                    ...route,
                    name: dest.name,
                    id: dest.id
                  }
                } catch (error) {
                  console.warn(`Route calculation failed for ${dest.name}:`, error)
                  errors.push(`${dest.name}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
                  return null
                }
              })

              const batchResults = await Promise.all(batchPromises)
              results.push(...batchResults.filter((route): route is DetailedRouteResult => route !== null))

              // Small delay between batches to respect rate limits
              if (i + batchSize < destinations.length) {
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            }

            // Sort results by distance
            results.sort((a, b) => a.distance - b.distance)

            set((state) => {
              state.routes = results
              state.isCalculating = false
              
              if (errors.length > 0) {
                state.error = `Einige Routen konnten nicht berechnet werden: ${errors.join(', ')}`
              }
            })

            return results

          } catch (error) {
            set((state) => {
              state.isCalculating = false
              state.error = error instanceof Error ? error.message : 'Fehler bei der Routenberechnung'
            })
            throw error
          }
        },

        setCurrentRoute: (route) => {
          set((state) => {
            state.currentRoute = route
          })
        },

        addRoute: (route) => {
          set((state) => {
            const existingIndex = state.routes.findIndex((r: DetailedRouteResult) => r.id === route.id)
            if (existingIndex >= 0) {
              state.routes[existingIndex] = route
            } else {
              state.routes.push(route)
            }
          })
        },

        removeRoute: (routeId) => {
          set((state) => {
            state.routes = state.routes.filter((r: DetailedRouteResult) => r.id !== routeId)
            if (state.currentRoute?.id === routeId) {
              state.currentRoute = null
            }
          })
        },

        clearRoutes: () => {
          set((state) => {
            state.routes = []
            state.currentRoute = null
          })
        },

        setError: (error) => {
          set((state) => {
            state.error = error
          })
        },

        clearError: () => {
          set((state) => {
            state.error = null
          })
        },

        updateCacheStats: () => {
          const stats = routeCache.getStats()
          set((state) => {
            state.cacheStats = {
              hits: stats.hitRate > 0 ? Math.round(stats.size * stats.hitRate) : 0,
              misses: stats.size - Math.round(stats.size * stats.hitRate),
              hitRate: Math.round(stats.hitRate * 100)
            }
          })
        },

        resetStats: () => {
          set((state) => {
            state.cacheStats = { hits: 0, misses: 0, hitRate: 0 }
            state.providerStats = { osrm: 0, valhalla: 0, fallback: 0 }
            state.requestHistory = []
          })
        },

        cancelAllRequests: () => {
          // Cancel current requests
          globalAbortController.abort()
          globalAbortController = new AbortController()

          set((state) => {
            state.activeRequests.forEach((req: RouteRequest) => {
              req.status = 'error'
              state.requestHistory.push(req)
            })
            state.activeRequests = []
            state.isCalculating = false
          })
        },

        retryFailedRequests: async () => {
          const failedRequests = get().requestHistory.filter((r: RouteRequest) => r.status === 'error')
          
          if (failedRequests.length === 0) return

          set((state) => {
            state.error = null
          })

          for (const request of failedRequests) {
            try {
              await get().calculateRoute(request.origin, request.destination)
            } catch (error) {
              console.warn('Retry failed for request:', request.id, error)
            }
          }
        }
      })),
      {
        name: 'routing-store',
        partialize: (state) => ({
          // Only persist routes and stats, not UI state
          routes: state.routes,
          currentRoute: state.currentRoute,
          cacheStats: state.cacheStats,
          providerStats: state.providerStats,
          requestHistory: state.requestHistory.slice(-50) // Keep last 50 requests
        })
      }
    ),
    {
      name: 'routing-store'
    }
  )
)

// Hook for easy provider statistics access
export const useProviderStats = () => {
  const { providerStats, cacheStats } = useRoutingStore()
  
  const totalRequests = Object.values(providerStats).reduce((sum, count) => sum + count, 0)
  
  return {
    ...providerStats,
    totalRequests,
    cacheHitRate: cacheStats.hitRate,
    preferredProvider: totalRequests > 0 
      ? Object.entries(providerStats).reduce((a, b) => 
          providerStats[a[0] as keyof typeof providerStats] > providerStats[b[0] as keyof typeof providerStats] ? a : b
        )[0]
      : 'none'
  }
}

// Hook for performance monitoring
export const useRoutingPerformance = () => {
  const { cacheStats, providerStats, requestHistory, updateCacheStats } = useRoutingStore()
  
  const recentRequests = requestHistory.slice(-20)
  const successRate = recentRequests.length > 0 
    ? (recentRequests.filter((r: RouteRequest) => r.status === 'success').length / recentRequests.length) * 100
    : 0

  const averageResponseTime = recentRequests.length > 0
    ? recentRequests.reduce((sum, req: RouteRequest) => sum + (Date.now() - req.timestamp), 0) / recentRequests.length
    : 0

  return {
    cacheStats,
    providerStats,
    successRate: Math.round(successRate),
    averageResponseTime: Math.round(averageResponseTime),
    totalRequests: Object.values(providerStats).reduce((sum, count) => sum + count, 0),
    updateStats: updateCacheStats
  }
} 
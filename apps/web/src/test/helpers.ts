import { vi, expect } from 'vitest'
import type { Coordinates, DetailedRouteResult } from '@/services/routing/types'

// Test data constants
export const TEST_COORDINATES = {
  STUTTGART: [9.1829, 48.7758] as Coordinates,
  KARLSRUHE: [8.4037, 49.0069] as Coordinates,
  MUNICH: [11.5820, 48.1351] as Coordinates,
  BERLIN: [13.4050, 52.5200] as Coordinates,
  INVALID_LAT: [9.1829, 1000] as Coordinates,
  INVALID_LNG: [2000, 48.7758] as Coordinates,
}

// Mock route results for testing
export const MOCK_ROUTES = {
  OSRM_SUCCESS: {
    id: 'osrm-test-1',
    name: 'OSRM Route',
    distance: 15.5,
    duration: 18,
    geometry: {
      type: 'LineString' as const,
      coordinates: [TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE]
    },
    instructions: [
      {
        type: 'straight' as const,
        distance: 15500,
        duration: 1080,
        instruction: 'Head southwest on Test Street',
        coordinates: TEST_COORDINATES.STUTTGART
      },
      {
        type: 'arrival' as const,
        distance: 0,
        duration: 0,
        instruction: 'Arrive at destination',
        coordinates: TEST_COORDINATES.KARLSRUHE
      }
    ],
    provider: 'osrm' as const,
    traffic_aware: false,
    alternative_routes: []
  } as DetailedRouteResult,

  VALHALLA_SUCCESS: {
    id: 'valhalla-test-1',
    name: 'Valhalla Route',
    distance: 14.8,
    duration: 16,
    geometry: {
      type: 'LineString' as const,
      coordinates: [TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE]
    },
    instructions: [
      {
        type: 'straight' as const,
        distance: 14800,
        duration: 960,
        instruction: 'Head southwest via A8',
        coordinates: TEST_COORDINATES.STUTTGART
      },
      {
        type: 'arrival' as const,
        distance: 0,
        duration: 0,
        instruction: 'Arrive at destination',
        coordinates: TEST_COORDINATES.KARLSRUHE
      }
    ],
    provider: 'valhalla' as const,
    traffic_aware: true,
    alternative_routes: []
  } as DetailedRouteResult,

  HAVERSINE_FALLBACK: {
    id: 'haversine-test-1',
    name: 'Direct Route (Estimated)',
    distance: 85.2,
    duration: 102,
    geometry: {
      type: 'LineString' as const,
      coordinates: [TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE]
    },
    instructions: [
      {
        type: 'straight' as const,
        distance: 85200,
        duration: 6120,
        instruction: 'Direct route to destination (85.2 km)',
        coordinates: TEST_COORDINATES.KARLSRUHE
      }
    ],
    provider: 'fallback' as const,
    traffic_aware: false,
    alternative_routes: []
  } as DetailedRouteResult
}

// Mock API responses
export const MOCK_API_RESPONSES = {
  OSRM_SUCCESS: {
    code: 'Ok',
    routes: [{
      distance: 15500,
      duration: 1080,
      geometry: {
        type: 'LineString' as const,
        coordinates: [TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE]
      },
      legs: [{
        distance: 15500,
        duration: 1080,
        steps: [{
          distance: 15500,
          duration: 1080,
          geometry: {
            type: 'LineString' as const,
            coordinates: [TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE]
          },
          name: 'Test Street',
          mode: 'driving',
          maneuver: {
            type: 'depart',
            location: TEST_COORDINATES.STUTTGART
          }
        }]
      }]
    }]
  },

  VALHALLA_SUCCESS: {
    trip: {
      summary: { length: 14.8, time: 960 },
      legs: [{
        distance: 14800,
        time: 960,
        shape: 'mock_encoded_polyline',
        maneuvers: [
          {
            type: 1,
            instruction: 'Head southwest via A8',
            time: 960,
            length: 14.8,
            lat: TEST_COORDINATES.STUTTGART[1],
            lon: TEST_COORDINATES.STUTTGART[0],
            begin_shape_index: 0,
            end_shape_index: 1,
            rough: false,
            travel_mode: 0,
            travel_type: 0
          },
          {
            type: 4,
            instruction: 'Arrive at destination',
            time: 0,
            length: 0,
            lat: TEST_COORDINATES.KARLSRUHE[1],
            lon: TEST_COORDINATES.KARLSRUHE[0],
            begin_shape_index: 1,
            end_shape_index: 1,
            rough: false,
            travel_mode: 0,
            travel_type: 0
          }
        ]
      }]
    }
  },

  OSRM_EMPTY: {
    code: 'Ok',
    routes: []
  },

  VALHALLA_EMPTY: {
    trip: null
  }
}

// HTTP status codes for testing
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const

// Mock fetch responses helper
export function mockFetchResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
  return new Response(
    typeof data === 'string' ? data : JSON.stringify(data),
    {
      status,
      statusText: getStatusText(status),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }
  )
}

// Mock fetch error helper
export function mockFetchError(message: string = 'Failed to fetch') {
  return Promise.reject(new Error(message))
}

// Mock network timeout
export function mockFetchTimeout(delay: number = 5000) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'))
    }, delay)
  })
}

// Setup fetch mock for successful OSRM response
export function mockOSRMSuccess() {
  const mockFetch = vi.mocked(fetch)
  mockFetch.mockResolvedValueOnce(
    mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS)
  )
}

// Setup fetch mock for successful Valhalla response
export function mockValhallaSuccess() {
  const mockFetch = vi.mocked(fetch)
  mockFetch.mockResolvedValueOnce(
    mockFetchResponse(MOCK_API_RESPONSES.VALHALLA_SUCCESS)
  )
}

// Setup fetch mock for rate limiting scenario
export function mockRateLimit(provider: 'osrm' | 'valhalla' | 'both' = 'both') {
  const mockFetch = vi.mocked(fetch)
  
  if (provider === 'osrm' || provider === 'both') {
    mockFetch.mockResolvedValueOnce(
      mockFetchResponse('Rate Limited', HTTP_STATUS.RATE_LIMITED)
    )
  }
  
  if (provider === 'valhalla' || provider === 'both') {
    mockFetch.mockResolvedValueOnce(
      mockFetchResponse('Rate Limited', HTTP_STATUS.RATE_LIMITED)
    )
  }
}

// Setup fetch mock for server errors
export function mockServerError(provider: 'osrm' | 'valhalla' | 'both' = 'both') {
  const mockFetch = vi.mocked(fetch)
  
  if (provider === 'osrm' || provider === 'both') {
    mockFetch.mockResolvedValueOnce(
      mockFetchResponse('Internal Server Error', HTTP_STATUS.INTERNAL_ERROR)
    )
  }
  
  if (provider === 'valhalla' || provider === 'both') {
    mockFetch.mockResolvedValueOnce(
      mockFetchResponse('Internal Server Error', HTTP_STATUS.INTERNAL_ERROR)
    )
  }
}

// Setup fetch mock for network errors
export function mockNetworkError(provider: 'osrm' | 'valhalla' | 'both' = 'both') {
  const mockFetch = vi.mocked(fetch)
  
  if (provider === 'osrm' || provider === 'both') {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'))
  }
  
  if (provider === 'valhalla' || provider === 'both') {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'))
  }
}

// Wait for a specified number of milliseconds (for throttling tests)
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Create a spy for timing measurements
export function createTimingSpy() {
  const start = vi.fn(() => Date.now())
  const end = vi.fn(() => Date.now())
  
  return {
    start,
    end,
    getDuration: () => end() - start()
  }
}

// Assert that a function throws a specific error type
export async function expectToThrow<T extends Error>(
  fn: () => Promise<any>,
  errorClass: new (...args: any[]) => T,
  message?: string
) {
  try {
    await fn()
    throw new Error('Expected function to throw, but it did not')
  } catch (error) {
    expect(error).toBeInstanceOf(errorClass)
    if (message) {
      expect((error as Error).message).toContain(message)
    }
  }
}

// Helper to get HTTP status text
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  }
  
  return statusTexts[status] || 'Unknown'
}

// Mock console to capture logs in tests
export function mockConsole() {
  const originalConsole = { ...console }
  const logs: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  console.log = vi.fn((...args) => {
    logs.push(args.join(' '))
  })
  
  console.warn = vi.fn((...args) => {
    warnings.push(args.join(' '))
  })
  
  console.error = vi.fn((...args) => {
    errors.push(args.join(' '))
  })

  return {
    logs,
    warnings,
    errors,
    restore: () => {
      Object.assign(console, originalConsole)
    }
  }
} 
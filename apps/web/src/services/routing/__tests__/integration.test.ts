import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getOptimalRoute } from '../index'
import { routeCache } from '../cache'
import { 
  TEST_COORDINATES, 
  MOCK_API_RESPONSES, 
  mockFetchResponse,
  mockRateLimit,
  mockServerError,
  waitFor,
  mockConsole 
} from '../../../test/helpers'

const mockFetch = vi.mocked(fetch)

describe('Routing Service Integration Tests', () => {
  let consoleMock: ReturnType<typeof mockConsole>

  beforeEach(() => {
    vi.clearAllMocks()
    routeCache.clear()
    consoleMock = mockConsole()
  })

  afterEach(() => {
    vi.resetAllMocks()
    consoleMock.restore()
  })

  describe('End-to-End Routing Scenarios', () => {
    it('should handle complete success workflow with OSRM', async () => {
      // Arrange: Mock successful OSRM response
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS)
      )

      // Act: Request route
      const result = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Assert: Verify successful OSRM routing
      expect(result).toBeDefined()
      expect(result.provider).toBe('osrm')
      expect(result.distance).toBeCloseTo(15.5, 1)
      expect(result.duration).toBe(18)
      expect(result.geometry.type).toBe('LineString')
      expect(result.instructions).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      // Verify OSRM API was called with correct parameters
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('router.project-osrm.org/route/v1/driving'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: expect.objectContaining({
            'User-Agent': 'RevierKompass/1.0.0'
          })
        })
      )
    })

    it('should handle complete fallback workflow: OSRM 429 → Valhalla success', async () => {
      // Arrange: Mock OSRM rate limit, then Valhalla success
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse('Rate Limited', 429))
        .mockResolvedValueOnce(mockFetchResponse(MOCK_API_RESPONSES.VALHALLA_SUCCESS))

      // Act: Request route
      const result = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Assert: Verify Valhalla was used as fallback
      expect(result.provider).toBe('valhalla')
      expect(result.distance).toBeCloseTo(14.8, 1)
      expect(result.traffic_aware).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      
      // Verify both APIs were called in correct order
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        expect.stringContaining('router.project-osrm.org'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        expect.stringContaining('valhalla1.openstreetmap.de'),
        expect.any(Object)
      )

      // Verify warning was logged
      expect(consoleMock.warnings).toContain(
        expect.stringContaining('OSRM routing failed')
      )
    })

    it('should handle complete fallback workflow: All APIs fail → Haversine', async () => {
      // Arrange: Mock both APIs to fail
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse('Server Error', 500))
        .mockResolvedValueOnce(mockFetchResponse('Server Error', 500))

      // Act: Request route
      const result = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Assert: Verify Haversine fallback was used
      expect(result.provider).toBe('fallback')
      expect(result.name).toContain('Direct Route')
      expect(result.distance).toBeCloseTo(85, 5) // Approximate straight-line distance
      expect(result.traffic_aware).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Verify fallback warning was logged
      expect(consoleMock.warnings).toContain(
        expect.stringContaining('All routing providers failed')
      )
    })
  })

  describe('Caching Integration', () => {
    it('should cache successful routes and skip API calls on subsequent requests', async () => {
      // Arrange: Mock successful OSRM response
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS)
      )

      // Act: First request
      const result1 = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Act: Second request with same coordinates
      const result2 = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Assert: Second request should hit cache
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only one API call
      expect(result1).toEqual(result2) // Same result
      expect(result2.provider).toBe('osrm')
    })

    it('should not cache failed requests and retry APIs on subsequent requests', async () => {
      // Arrange: Mock APIs to fail, then succeed on retry
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse('Rate Limited', 429))
        .mockResolvedValueOnce(mockFetchResponse('Rate Limited', 429))
        // Second attempt - OSRM succeeds
        .mockResolvedValueOnce(mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS))

      // Act: First request (should fail and use fallback)
      const result1 = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Act: Second request (should retry APIs)
      const result2 = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Assert: First request used fallback, second succeeded with OSRM
      expect(result1.provider).toBe('fallback')
      expect(result2.provider).toBe('osrm')
      expect(mockFetch).toHaveBeenCalledTimes(3) // 2 for first request + 1 for second
    })
  })

  describe('Throttling Integration', () => {
    it('should respect rate limits for concurrent requests', async () => {
      // Arrange: Mock successful responses
      mockFetch
        .mockResolvedValue(mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS))

      // Act: Make concurrent requests
      const start = Date.now()
      await Promise.all([
        getOptimalRoute(TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE),
        getOptimalRoute(TEST_COORDINATES.STUTTGART, TEST_COORDINATES.MUNICH),
        getOptimalRoute(TEST_COORDINATES.KARLSRUHE, TEST_COORDINATES.MUNICH)
      ])
      const duration = Date.now() - start

      // Assert: Should take at least 2 seconds for 3 requests (1 req/sec throttling)
      // First request is immediate, second after 1s, third after 2s
      expect(duration).toBeGreaterThan(1900) // Allow some tolerance
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should handle mixed cache hits and API calls efficiently', async () => {
      // Arrange: Mock successful response for first unique request
      mockFetch.mockResolvedValueOnce(
        mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS)
      )

      // Act: Make mixed requests (some will hit cache)
      const start = Date.now()
      await Promise.all([
        getOptimalRoute(TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE), // API call
        getOptimalRoute(TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE), // Cache hit
        getOptimalRoute(TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE)  // Cache hit
      ])
      const duration = Date.now() - start

      // Assert: Should be fast since 2 out of 3 requests hit cache
      expect(duration).toBeLessThan(1000) // Should complete quickly
      expect(mockFetch).toHaveBeenCalledTimes(1) // Only one API call
    })
  })

  describe('Error Recovery Integration', () => {
    it('should recover from network errors and continue with fallbacks', async () => {
      // Arrange: Mock network error followed by successful Valhalla response
      mockFetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce(mockFetchResponse(MOCK_API_RESPONSES.VALHALLA_SUCCESS))

      // Act: Request route
      const result = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Assert: Should successfully fallback to Valhalla
      expect(result.provider).toBe('valhalla')
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Verify error was handled gracefully
      expect(consoleMock.warnings).toContain(
        expect.stringContaining('OSRM routing failed')
      )
    })

    it('should handle timeout scenarios gracefully', async () => {
      // Arrange: Mock timeout for OSRM, success for Valhalla
      mockFetch
        .mockImplementationOnce(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
        )
        .mockResolvedValueOnce(mockFetchResponse(MOCK_API_RESPONSES.VALHALLA_SUCCESS))

      // Act: Request route
      const result = await getOptimalRoute(
        TEST_COORDINATES.STUTTGART,
        TEST_COORDINATES.KARLSRUHE
      )

      // Assert: Should fallback to Valhalla after timeout
      expect(result.provider).toBe('valhalla')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Real-world Scenario Simulation', () => {
    it('should handle peak traffic simulation with mixed success/failure', async () => {
      // Simulate peak traffic: some requests succeed, others are rate-limited
      const coordinates = [
        [TEST_COORDINATES.STUTTGART, TEST_COORDINATES.KARLSRUHE],
        [TEST_COORDINATES.STUTTGART, TEST_COORDINATES.MUNICH],
        [TEST_COORDINATES.KARLSRUHE, TEST_COORDINATES.MUNICH],
        [TEST_COORDINATES.BERLIN, TEST_COORDINATES.MUNICH]
      ]

      // Mock mixed responses: success, rate limit, success, server error
      mockFetch
        .mockResolvedValueOnce(mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS))
        .mockResolvedValueOnce(mockFetchResponse('Rate Limited', 429))
        .mockResolvedValueOnce(mockFetchResponse(MOCK_API_RESPONSES.VALHALLA_SUCCESS))
        .mockResolvedValueOnce(mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS))
        .mockResolvedValueOnce(mockFetchResponse('Server Error', 500))
        .mockResolvedValueOnce(mockFetchResponse('Server Error', 500))

      // Act: Process all requests
      const results = await Promise.all(
        coordinates.map(([origin, dest]) => getOptimalRoute(origin, dest))
      )

      // Assert: All requests should complete with appropriate providers
      expect(results).toHaveLength(4)
      expect(results[0].provider).toBe('osrm')     // Success
      expect(results[1].provider).toBe('valhalla') // OSRM rate limited, Valhalla success
      expect(results[2].provider).toBe('osrm')     // Success
      expect(results[3].provider).toBe('fallback') // Both APIs failed

      // Verify all results have valid data
      results.forEach(result => {
        expect(result.distance).toBeGreaterThan(0)
        expect(result.duration).toBeGreaterThan(0)
        expect(result.geometry.coordinates).toHaveLength(2)
        expect(result.instructions.length).toBeGreaterThan(0)
      })
    })

    it('should maintain performance under sustained load', async () => {
      // Arrange: Mock consistent successful responses
      mockFetch.mockResolvedValue(
        mockFetchResponse(MOCK_API_RESPONSES.OSRM_SUCCESS)
      )

      // Act: Simulate sustained load with repeat requests
      const batchSize = 5
      const batches = 3
      const allResults: any[] = []

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = Array(batchSize).fill(null).map((_, i) => 
          getOptimalRoute(
            TEST_COORDINATES.STUTTGART,
            [TEST_COORDINATES.KARLSRUHE[0] + (i * 0.001), TEST_COORDINATES.KARLSRUHE[1]]
          )
        )
        
        const batchResults = await Promise.all(batchPromises)
        allResults.push(...batchResults)
        
        // Small delay between batches to simulate real usage
        await waitFor(100)
      }

      // Assert: All requests should complete successfully
      expect(allResults).toHaveLength(batchSize * batches)
      expect(mockFetch).toHaveBeenCalledTimes(batchSize * batches)
      
      // Verify no requests failed
      allResults.forEach(result => {
        expect(result.provider).toBe('osrm')
        expect(result.distance).toBeGreaterThan(0)
      })
    })
  })
}) 
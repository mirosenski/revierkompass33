import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getOptimalRoute, clearCache } from '../index'
import { memoryCache } from '../cache/memoryCache'
import { RoutingError, InvalidCoordinateError } from '../errors'
import type { LatLng, RouteResult } from '../providers/osrm'

// Test data
const baseOrigin: LatLng = { lat: 48.7758, lng: 9.1829 } // Stuttgart
const baseDest: LatLng = { lat: 49.0069, lng: 8.4037 }   // Karlsruhe

describe('Routing Service - Core Functionality', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await clearCache() // Clear both memory and IndexedDB cache
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Coordinate Validation', () => {
    it('should throw InvalidCoordinateError for invalid latitude', async () => {
      const invalidOrigin: LatLng = { lat: 1000, lng: 9.1829 } // Invalid lat
      await expect(getOptimalRoute(invalidOrigin, baseDest))
        .rejects.toThrow(InvalidCoordinateError)
    })

    it('should throw InvalidCoordinateError for invalid longitude', async () => {
      const invalidOrigin: LatLng = { lat: 48.7758, lng: 2000 } // Invalid lng
      await expect(getOptimalRoute(invalidOrigin, baseDest))
        .rejects.toThrow(InvalidCoordinateError)
    })

    it('should accept valid coordinates', async () => {
      const result = await getOptimalRoute(baseOrigin, baseDest)
      expect(result).toBeDefined()
      expect(result.provider).toBeDefined()
      expect(result.distance).toBeGreaterThan(0)
      expect(result.duration).toBeGreaterThan(0)
      expect(result.geometry).toBeDefined()
    })
  })

  describe('Provider Fallback Logic', () => {
    it('should return a valid route result', async () => {
      const result = await getOptimalRoute(baseOrigin, baseDest)
      
      expect(result).toBeDefined()
      expect(result.provider).toBeDefined()
      expect(['osrm', 'valhalla', 'haversine']).toContain(result.provider)
      expect(result.distance).toBeGreaterThan(0)
      expect(result.duration).toBeGreaterThan(0)
      expect(result.geometry).toBeDefined()
      expect(result.geometry.type).toBe('LineString')
      expect(result.geometry.coordinates).toBeDefined()
      expect(result.geometry.coordinates.length).toBeGreaterThan(0)
    })

    it('should handle different coordinate pairs', async () => {
      const origin2: LatLng = { lat: 52.5200, lng: 13.4050 } // Berlin
      const dest2: LatLng = { lat: 53.5511, lng: 9.9937 }    // Hamburg

      const result = await getOptimalRoute(origin2, dest2)
      
      expect(result).toBeDefined()
      expect(result.provider).toBeDefined()
      expect(result.distance).toBeGreaterThan(0)
      expect(result.duration).toBeGreaterThan(0)
    })
  })

  describe('Caching Mechanism', () => {
    it('should cache successful routes and return cached result on subsequent calls', async () => {
      // First call - should hit API or fallback
      const result1 = await getOptimalRoute(baseOrigin, baseDest)
      expect(result1).toBeDefined()

      // Second call with same coordinates - should hit cache
      const result2 = await getOptimalRoute(baseOrigin, baseDest)
      expect(result2).toBeDefined()
      
      // Results should be identical
      expect(result1).toEqual(result2)
    })

    it('should handle different coordinates as separate cache entries', async () => {
      const origin2: LatLng = { lat: 52.5200, lng: 13.4050 } // Berlin
      const dest2: LatLng = { lat: 53.5511, lng: 9.9937 }    // Hamburg

      const result1 = await getOptimalRoute(baseOrigin, baseDest)
      const result2 = await getOptimalRoute(origin2, dest2)
      
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      expect(result1.geometry.coordinates).not.toEqual(result2.geometry.coordinates) // Unterschiedliche Geometrien
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid coordinates gracefully', async () => {
      const invalidOrigin: LatLng = { lat: 1000, lng: 9.1829 } // Invalid lat
      const invalidDest: LatLng = { lat: 48.7758, lng: 2000 }  // Invalid lng

      await expect(getOptimalRoute(invalidOrigin, baseDest))
        .rejects.toThrow(InvalidCoordinateError)
      
      await expect(getOptimalRoute(baseOrigin, invalidDest))
        .rejects.toThrow(InvalidCoordinateError)
    })
  })

  describe('Performance Tests', () => {
    it('should complete routing within reasonable time', async () => {
      const start = Date.now()
      await getOptimalRoute(baseOrigin, baseDest)
      const duration = Date.now() - start

      // Should complete in less than 10 seconds (allowing for network calls)
      expect(duration).toBeLessThan(10000)
    })
  })

  describe('Cache Management', () => {
    it('should clear cache when clearCache is called', async () => {
      // First call to populate cache
      await getOptimalRoute(baseOrigin, baseDest)
      expect(memoryCache.getSize()).toBeGreaterThan(0)

      // Clear cache
      await clearCache()
      expect(memoryCache.getSize()).toBe(0)
    })
  })

  describe('Route Properties', () => {
    it('should return route with all required properties', async () => {
      const result = await getOptimalRoute(baseOrigin, baseDest)
      
      // Check all required properties exist
      expect(result).toHaveProperty('distance')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('geometry')
      expect(result).toHaveProperty('provider')
      expect(result).toHaveProperty('confidence')
      
      // Check property types
      expect(typeof result.distance).toBe('number')
      expect(typeof result.duration).toBe('number')
      expect(typeof result.provider).toBe('string')
      expect(typeof result.confidence).toBe('number')
      expect(typeof result.geometry).toBe('object')
      
      // Check geometry structure
      expect(result.geometry).toHaveProperty('type')
      expect(result.geometry).toHaveProperty('coordinates')
      expect(result.geometry.type).toBe('LineString')
      expect(Array.isArray(result.geometry.coordinates)).toBe(true)
    })
  })
}) 
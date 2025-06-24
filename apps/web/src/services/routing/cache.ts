import type { DetailedRouteResult, Coordinates } from './types'

// Custom InvalidCoordinateError class
export class InvalidCoordinateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCoordinateError'
  }
}

// Simple LRU Cache implementation
class LRUCache<K, V> {
  private readonly maxSize: number
  private readonly cache = new Map<K, { value: V; timestamp: number; accessCount: number }>()
  private readonly defaultTTL: number

  constructor(maxSize: number = 100, defaultTTL: number = 15 * 60 * 1000) { // 15 minutes default
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return undefined
    }
    
    // Update access count and move to end (most recently used)
    entry.accessCount++
    this.cache.delete(key)
    this.cache.set(key, entry)
    
    return entry.value
  }

  set(key: K, value: V, customTTL?: number): void {
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    
    // If at capacity, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    })
  }

  has(key: K): boolean {
    const entry = this.cache.get(key)
    if (!entry) {
      return false
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; hitRate: number } {
    let totalAccess = 0
    let entries = 0
    
    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount
      entries++
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: entries > 0 ? totalAccess / entries : 0
    }
  }

  // Clean expired entries
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key)
        removed++
      }
    }
    
    return removed
  }
}

// Global route cache instance
export const routeCache = new LRUCache<string, DetailedRouteResult>(100, 15 * 60 * 1000) // 100 entries, 15 min TTL

// Generate cache key from coordinates
export function getCacheKey(origin: Coordinates, destination: Coordinates): string {
  const [originLng, originLat] = origin
  const [destLng, destLat] = destination
  
  // Round to 4 decimal places to avoid cache misses for nearly identical coordinates
  const roundedOrigin = `${originLng.toFixed(4)},${originLat.toFixed(4)}`
  const roundedDest = `${destLng.toFixed(4)},${destLat.toFixed(4)}`
  
  return `${roundedOrigin}|${roundedDest}`
}

// Periodic cleanup of expired cache entries
setInterval(() => {
  const removed = routeCache.cleanup()
  if (removed > 0) {
    console.debug(`Cleaned up ${removed} expired cache entries`)
  }
}, 5 * 60 * 1000) // Run every 5 minutes 
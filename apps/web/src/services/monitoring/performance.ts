import React from 'react'
import { routeCache } from '../routing/cache'
import type { DetailedRouteResult } from '../routing'

interface PerformanceMetrics {
  timestamp: number
  requestCount: number
  cacheHitRate: number
  averageResponseTime: number
  providerDistribution: Record<string, number>
  errorRate: number
  memoryUsage: number
}

interface PerformanceAlert {
  id: string
  type: 'cache_low' | 'error_high' | 'response_slow' | 'memory_high'
  message: string
  timestamp: number
  severity: 'low' | 'medium' | 'high'
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private alerts: PerformanceAlert[] = []
  private requestTimes: number[] = []
  private errorCount = 0
  private totalRequests = 0
  private providerCounts: Record<string, number> = {}

  // Thresholds for alerts
  private readonly THRESHOLDS = {
    CACHE_HIT_RATE_LOW: 50, // %
    ERROR_RATE_HIGH: 10, // %
    RESPONSE_TIME_SLOW: 5000, // ms
    MEMORY_USAGE_HIGH: 100 * 1024 * 1024 // 100MB
  }

  constructor() {
    // Collect metrics every 30 seconds
    setInterval(() => this.collectMetrics(), 30000)
    
    // Clean old data every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  // Track routing request performance
  trackRequest(startTime: number, endTime: number, result: DetailedRouteResult | null, error?: Error) {
    const responseTime = endTime - startTime
    this.requestTimes.push(responseTime)
    this.totalRequests++

    if (error) {
      this.errorCount++
      this.checkErrorRate()
    } else if (result) {
      this.providerCounts[result.provider] = (this.providerCounts[result.provider] || 0) + 1
    }

    this.checkResponseTime(responseTime)
    
    // Keep only recent request times (last 100)
    if (this.requestTimes.length > 100) {
      this.requestTimes = this.requestTimes.slice(-100)
    }
  }

  // Collect comprehensive metrics
  private collectMetrics() {
    const cacheStats = routeCache.getStats()
    const memoryUsage = this.getMemoryUsage()

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      requestCount: this.totalRequests,
      cacheHitRate: cacheStats.hitRate * 100,
      averageResponseTime: this.getAverageResponseTime(),
      providerDistribution: { ...this.providerCounts },
      errorRate: this.totalRequests > 0 ? (this.errorCount / this.totalRequests) * 100 : 0,
      memoryUsage
    }

    this.metrics.push(metrics)
    this.checkThresholds(metrics)

    // Keep only last 24 hours of metrics (assuming 30s intervals = 2880 entries)
    if (this.metrics.length > 2880) {
      this.metrics = this.metrics.slice(-2880)
    }
  }

  // Check performance thresholds and create alerts
  private checkThresholds(metrics: PerformanceMetrics) {
    this.checkCacheHitRate(metrics.cacheHitRate)
    this.checkMemoryUsage(metrics.memoryUsage)
  }

  private checkCacheHitRate(hitRate: number) {
    if (hitRate < this.THRESHOLDS.CACHE_HIT_RATE_LOW) {
      this.createAlert('cache_low', `Cache hit rate is low: ${hitRate.toFixed(1)}%`, 'medium')
    }
  }

  private checkErrorRate() {
    const errorRate = (this.errorCount / this.totalRequests) * 100
    if (errorRate > this.THRESHOLDS.ERROR_RATE_HIGH) {
      this.createAlert('error_high', `Error rate is high: ${errorRate.toFixed(1)}%`, 'high')
    }
  }

  private checkResponseTime(responseTime: number) {
    if (responseTime > this.THRESHOLDS.RESPONSE_TIME_SLOW) {
      this.createAlert('response_slow', `Slow response time: ${responseTime}ms`, 'medium')
    }
  }

  private checkMemoryUsage(memoryUsage: number) {
    if (memoryUsage > this.THRESHOLDS.MEMORY_USAGE_HIGH) {
      this.createAlert('memory_high', `High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`, 'high')
    }
  }

  private createAlert(type: PerformanceAlert['type'], message: string, severity: PerformanceAlert['severity']) {
    const alert: PerformanceAlert = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now(),
      severity
    }

    this.alerts.push(alert)
    
    // Log critical alerts
    if (severity === 'high') {
      console.error('Performance Alert:', alert)
    } else {
      console.warn('Performance Alert:', alert)
    }

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50)
    }
  }

  private getAverageResponseTime(): number {
    if (this.requestTimes.length === 0) return 0
    return this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      // @ts-ignore - performance.memory is not standard but available in Chrome
      return performance.memory?.usedJSHeapSize || 0
    }
    return 0
  }

  private cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    
    // Clean old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo)
    
    // Reset counters periodically to prevent overflow
    if (this.totalRequests > 10000) {
      this.totalRequests = Math.floor(this.totalRequests * 0.8)
      this.errorCount = Math.floor(this.errorCount * 0.8)
    }
  }

  // Public API for accessing metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts]
  }

  getActiveAlerts(): PerformanceAlert[] {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    return this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo)
  }

  // Performance summary for dashboards
  getSummary() {
    const latest = this.getLatestMetrics()
    const activeAlerts = this.getActiveAlerts()
    
    return {
      status: activeAlerts.length === 0 ? 'healthy' : 
              activeAlerts.some(a => a.severity === 'high') ? 'critical' : 'warning',
      totalRequests: this.totalRequests,
      cacheHitRate: latest?.cacheHitRate || 0,
      averageResponseTime: latest?.averageResponseTime || 0,
      errorRate: latest?.errorRate || 0,
      activeAlerts: activeAlerts.length,
      topProvider: this.getTopProvider(),
      memoryUsage: latest?.memoryUsage || 0
    }
  }

  private getTopProvider(): string {
    const entries = Object.entries(this.providerCounts)
    if (entries.length === 0) return 'none'
    
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
  }

  // Clear all metrics and alerts
  reset() {
    this.metrics = []
    this.alerts = []
    this.requestTimes = []
    this.errorCount = 0
    this.totalRequests = 0
    this.providerCounts = {}
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Enhanced routing service wrapper with performance tracking
export async function trackRoutingPerformance<T>(
  operation: () => Promise<T>,
  operationName: string = 'routing'
): Promise<T> {
  const startTime = performance.now()
  let result: T | null = null
  let error: Error | undefined

  try {
    result = await operation()
    return result
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err))
    throw error
  } finally {
    const endTime = performance.now()
    performanceMonitor.trackRequest(startTime, endTime, result as any, error)
  }
}

// Production deployment configuration
export const PRODUCTION_CONFIG = {
  // API endpoints for production
  endpoints: {
    osrm: {
      primary: process.env.VITE_OSRM_ENDPOINT || 'https://router.project-osrm.org',
      fallbacks: [
        'https://routing.openstreetmap.de',
        'https://osrm-api.openstreetmap.de'
      ]
    },
    valhalla: {
      primary: process.env.VITE_VALHALLA_ENDPOINT || 'https://valhalla1.openstreetmap.de',
      fallbacks: []
    }
  },

  // Performance settings
  performance: {
    cacheSize: parseInt(process.env.VITE_CACHE_SIZE || '100'),
    cacheTtl: parseInt(process.env.VITE_CACHE_TTL || '900000'), // 15 minutes
    requestTimeout: parseInt(process.env.VITE_REQUEST_TIMEOUT || '10000'), // 10 seconds
    rateLimitPerSecond: parseFloat(process.env.VITE_RATE_LIMIT || '1')
  },

  // Monitoring settings
  monitoring: {
    enabled: process.env.VITE_MONITORING_ENABLED === 'true',
    alertWebhook: process.env.VITE_ALERT_WEBHOOK,
    metricsEndpoint: process.env.VITE_METRICS_ENDPOINT
  },

  // Feature flags
  features: {
    enableValhalla: process.env.VITE_ENABLE_VALHALLA !== 'false',
    enableOSRM: process.env.VITE_ENABLE_OSRM !== 'false',
    enableFallback: process.env.VITE_ENABLE_FALLBACK !== 'false',
    enableDebug: process.env.NODE_ENV === 'development' || process.env.VITE_DEBUG_ROUTING === 'true'
  }
}

// Environment-specific health check
export async function performHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, boolean>
  timestamp: number
}> {
  const services: Record<string, boolean> = {}
  
  // Test OSRM endpoint
  try {
    const response = await fetch(`${PRODUCTION_CONFIG.endpoints.osrm.primary}/route/v1/driving/9.1829,48.7758;9.1829,48.7758?overview=false`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    services.osrm = response.ok
  } catch {
    services.osrm = false
  }

  // Test Valhalla endpoint if enabled
  if (PRODUCTION_CONFIG.features.enableValhalla) {
    try {
      const response = await fetch(`${PRODUCTION_CONFIG.endpoints.valhalla.primary}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: [{ lat: 48.7758, lon: 9.1829 }, { lat: 48.7758, lon: 9.1829 }],
          costing: 'auto'
        }),
        signal: AbortSignal.timeout(5000)
      })
      services.valhalla = response.ok
    } catch {
      services.valhalla = false
    }
  }

  // Determine overall status
  const workingServices = Object.values(services).filter(Boolean).length
  const totalServices = Object.keys(services).length
  
  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (workingServices === totalServices) {
    status = 'healthy'
  } else if (workingServices > 0) {
    status = 'degraded'
  } else {
    status = 'unhealthy'
  }

  return {
    status,
    services,
    timestamp: Date.now()
  }
}

// React hook for performance data (exported for use in React components)
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics[]>([])
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([])
  const [summary, setSummary] = React.useState(performanceMonitor.getSummary())

  React.useEffect(() => {
    const updateData = () => {
      setMetrics(performanceMonitor.getMetrics())
      setAlerts(performanceMonitor.getActiveAlerts())
      setSummary(performanceMonitor.getSummary())
    }

    // Update every 30 seconds
    const interval = setInterval(updateData, 30000)
    updateData() // Initial update

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    alerts,
    summary,
    reset: () => performanceMonitor.reset()
  }
} 
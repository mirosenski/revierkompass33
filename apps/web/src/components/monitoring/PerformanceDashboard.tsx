import React from 'react'
import { usePerformanceMonitor, performHealthCheck, PRODUCTION_CONFIG } from '@/services/monitoring/performance'

export function PerformanceDashboard() {
  const { summary, alerts, metrics } = usePerformanceMonitor()
  const [healthStatus, setHealthStatus] = React.useState<any>(null)

  React.useEffect(() => {
    performHealthCheck().then(setHealthStatus)
    const interval = setInterval(() => {
      performHealthCheck().then(setHealthStatus)
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (!PRODUCTION_CONFIG.monitoring.enabled) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Routing Performance</h4>
        <div className={`text-xs font-medium ${getStatusColor(summary.status)}`}>
          {summary.status.toUpperCase()}
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Cache Hit Rate:</span>
          <span className="font-medium">{summary.cacheHitRate.toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between">
          <span>Avg Response:</span>
          <span className="font-medium">{summary.averageResponseTime.toFixed(0)}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total Requests:</span>
          <span className="font-medium">{summary.totalRequests}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Top Provider:</span>
          <span className="font-medium capitalize">{summary.topProvider}</span>
        </div>

        {healthStatus && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-xs font-medium mb-1">Service Status:</div>
            {Object.entries(healthStatus.services).map(([service, status]) => (
              <div key={service} className="flex justify-between">
                <span className="capitalize">{service}:</span>
                <span className={status ? 'text-green-600' : 'text-red-600'}>
                  {status ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        )}

        {alerts.length > 0 && (
          <div className="mt-3 pt-2 border-t border-red-100">
            <div className="text-xs font-medium text-red-600 mb-1">
              Active Alerts ({alerts.length})
            </div>
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="text-xs text-red-600 truncate">
                {alert.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
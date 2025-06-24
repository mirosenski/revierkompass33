# Routing Service - API Limits & Testing

## Overview

RevierKompass uses a robust routing service with multiple providers and comprehensive fallback mechanisms to ensure reliable route calculations even when external APIs are rate-limited or unavailable.

## Routing Providers

### Primary Providers

1. **OSRM (Open Source Routing Machine)**
   - **Endpoint**: `https://router.project-osrm.org`
   - **Rate Limit**: ~1 request/second (public demo server)
   - **Features**: Fast routing, driving profiles
   - **Fallback**: Yes (multiple endpoints available)

2. **Valhalla**
   - **Endpoint**: `https://valhalla1.openstreetmap.de`
   - **Rate Limit**: 1 request/second per IP
   - **Features**: Traffic-aware routing, multiple transport modes
   - **Fallback**: Yes (used as secondary provider)

3. **Haversine Fallback**
   - **Type**: Mathematical calculation (no API calls)
   - **Rate Limit**: None (local calculation)
   - **Features**: Straight-line distance estimation
   - **Use Case**: When all API providers fail

## Rate Limiting & Performance

### Built-in Throttling
- All external API calls are automatically throttled to **1 request/second**
- Prevents hitting rate limits during development and testing
- Uses intelligent queuing system for multiple simultaneous requests

### Caching Strategy
- **Cache Duration**: 15 minutes for successful routes
- **Cache Size**: 100 most recent routes (LRU eviction)
- **Cache Key**: Based on origin and destination coordinates
- **Fallback Cache**: 5 minutes for emergency fallback routes

### Error Handling
- **Rate Limits (HTTP 429)**: Automatic fallback to next provider
- **Network Errors**: Retry with alternative endpoints
- **Invalid Responses**: Graceful degradation to fallback
- **Coordinate Validation**: Immediate error for invalid input

## Development Setup

### CORS Proxy Configuration

During development, requests to external APIs are proxied through Vite to avoid CORS issues:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api/valhalla': {
      target: 'https://valhalla1.openstreetmap.de',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/valhalla/, '')
    },
    '/api/osrm': {
      target: 'https://router.project-osrm.org',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/osrm/, '')
    }
  }
}
```

### Environment Variables

```bash
# Optional: Custom API endpoints
VITE_OSRM_ENDPOINT=https://your-osrm-instance.com
VITE_VALHALLA_ENDPOINT=https://your-valhalla-instance.com

# Optional: Enable debug logging
VITE_DEBUG_ROUTING=true
```

## Testing

### Test Configuration

The routing service includes comprehensive tests with mocked API responses to avoid hitting rate limits during testing:

```bash
# Run all routing tests
npm run test:routing

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Categories

1. **Coordinate Validation**
   - Invalid latitude/longitude ranges
   - Type checking for coordinate parameters
   - Edge cases (null, undefined, non-numeric values)

2. **Provider Fallback Logic**
   - OSRM success scenario
   - Rate limiting (HTTP 429) fallback to Valhalla
   - Complete API failure fallback to Haversine
   - Network error handling

3. **Caching Mechanism**
   - Cache hits for identical requests
   - Cache misses for different coordinates
   - Cache expiration and cleanup
   - Memory usage optimization

4. **Rate Limiting & Throttling**
   - Request spacing verification
   - Concurrent request handling
   - Performance under load

5. **Error Scenarios**
   - JSON parsing errors
   - Empty API responses
   - Timeout handling
   - Invalid API responses

### Mock Data Examples

```typescript
// Test coordinates
const STUTTGART = [9.1829, 48.7758]
const KARLSRUHE = [8.4037, 49.0069]

// Mock successful OSRM response
const mockOSRMResponse = {
  code: 'Ok',
  routes: [{
    distance: 15500, // meters
    duration: 1080,  // seconds
    geometry: { /* GeoJSON LineString */ }
  }]
}

// Test rate limiting scenario
it('should fallback to Valhalla when OSRM returns 429', async () => {
  mockFetch
    .mockResolvedValueOnce(new Response('Rate Limited', { status: 429 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(mockValhallaResponse)))
  
  const result = await getOptimalRoute(STUTTGART, KARLSRUHE)
  expect(result.provider).toBe('valhalla')
})
```

## Production Deployment

### Self-Hosting Options

For production deployments with higher traffic, consider self-hosting routing services:

1. **OSRM Setup**
   ```bash
   # Docker deployment
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/germany-latest.osm.pbf
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/germany-latest.osrm
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/germany-latest.osrm
   docker run -t -i -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/germany-latest.osrm
   ```

2. **Valhalla Setup**
   ```bash
   # Using Docker Compose
   docker-compose up -d valhalla
   ```

### Performance Monitoring

```typescript
// Enable performance monitoring
import { routeCache } from '@/services/routing/cache'

// Get cache statistics
const stats = routeCache.getStats()
console.log(`Cache hit rate: ${stats.hitRate}%`)
console.log(`Cache size: ${stats.size}/${stats.maxSize}`)
```

## API Rate Limits Summary

| Provider | Rate Limit | Fallback Strategy | Cache Duration |
|----------|------------|-------------------|----------------|
| OSRM | ~1 req/sec | → Valhalla | 15 minutes |
| Valhalla | 1 req/sec/IP | → Haversine | 15 minutes |
| Haversine | None | Final fallback | 5 minutes |

## Troubleshooting

### Common Issues

1. **Tests timing out**
   ```bash
   # Ensure mocks are properly set up
   vi.stubGlobal('fetch', mockFetch)
   ```

2. **CORS errors in development**
   ```bash
   # Check proxy configuration in vite.config.ts
   # Ensure development server is running
   npm run dev
   ```

3. **Rate limiting in production**
   ```bash
   # Monitor cache hit rates
   # Consider implementing exponential backoff
   # Use multiple API keys if available
   ```

4. **Memory issues with cache**
   ```bash
   # Adjust cache size in cache.ts
   # Monitor memory usage
   # Implement cache cleanup intervals
   ```

### Debug Mode

Enable detailed logging for troubleshooting:

```typescript
// Set environment variable
VITE_DEBUG_ROUTING=true

// Or enable in code
localStorage.setItem('debug', 'routing')
```

This will log:
- API request URLs and timing
- Cache hits and misses
- Provider fallback decisions
- Error details and retry attempts

## Contributing

When contributing to the routing service:

1. **Always add tests** for new features
2. **Mock external APIs** in tests
3. **Handle errors gracefully** with appropriate fallbacks
4. **Document rate limits** for new providers
5. **Update cache strategies** as needed

For more information, see [CONTRIBUTING.md](../CONTRIBUTING.md).
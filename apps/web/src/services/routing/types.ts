// Basic coordinate type [longitude, latitude]
export type Coordinates = [number, number]

// Route instruction for turn-by-turn navigation
export interface RouteInstruction {
  type: 'turn' | 'straight' | 'merge' | 'roundabout' | 'arrival'
  direction?: 'left' | 'right' | 'straight'
  street_name?: string
  distance: number // meters
  duration: number // seconds
  coordinates: Coordinates
  instruction: string
}

// GeoJSON-like geometry
export interface RouteGeometry {
  type: 'LineString'
  coordinates: Coordinates[]
}

// Main route result interface
export interface DetailedRouteResult {
  id: string
  name: string
  distance: number // kilometers
  duration: number // minutes
  geometry: RouteGeometry
  instructions: RouteInstruction[]
  provider: 'osrm' | 'valhalla' | 'fallback'
  traffic_aware: boolean
  alternative_routes: AlternativeRoute[]
}

// Alternative route (simplified)
export interface AlternativeRoute {
  id: string
  name: string
  distance: number // kilometers
  duration: number // minutes
  geometry: RouteGeometry
}

// Route calculation options
export interface RouteOptions {
  profile?: 'driving' | 'walking' | 'cycling'
  avoid_tolls?: boolean
  avoid_highways?: boolean
  alternatives?: number // number of alternative routes to return
}

// Error types for better error handling
export class RoutingError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'RoutingError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public provider: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public provider: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// OSRM API response types
export interface OSRMResponse {
  code: string
  routes: OSRMRoute[]
  waypoints?: OSRMWaypoint[]
}

export interface OSRMRoute {
  distance: number
  duration: number
  geometry: RouteGeometry
  legs: OSRMLeg[]
}

export interface OSRMLeg {
  distance: number
  duration: number
  steps: OSRMStep[]
}

export interface OSRMStep {
  distance: number
  duration: number
  geometry: RouteGeometry
  name: string
  mode: string
  maneuver: OSRMManeuver
}

export interface OSRMManeuver {
  type: string
  modifier?: string
  location: Coordinates
  bearing_before?: number
  bearing_after?: number
}

export interface OSRMWaypoint {
  hint: string
  distance: number
  name: string
  location: Coordinates
}

// Valhalla API response types
export interface ValhallaResponse {
  trip: ValhallaTrip
  alternates?: ValhallaTrip[]
}

export interface ValhallaTrip {
  summary: ValhallaSummary
  legs: ValhallaLeg[]
}

export interface ValhallaSummary {
  time: number // seconds
  length: number // kilometers
  min_lat: number
  min_lon: number
  max_lat: number
  max_lon: number
}

export interface ValhallaLeg {
  summary: ValhallaSummary
  maneuvers: ValhallaManeuver[]
  shape: string // encoded polyline
}

export interface ValhallaManeuver {
  type: number
  instruction: string
  verbal_pre_transition_instruction?: string
  verbal_post_transition_instruction?: string
  street_names?: string[]
  time: number
  length: number
  begin_shape_index: number
  end_shape_index: number
  rough: boolean
  travel_mode: number
  travel_type: number
  lat: number
  lon: number
}

// Cache statistics
export interface CacheStats {
  size: number
  maxSize: number
  hitRate: number
  hits: number
  misses: number
} 
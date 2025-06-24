import { vi, afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep these methods for debugging
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  // Keep error and warn for important messages
  warn: console.warn,
  error: console.error,
}

// Mock fetch globally
global.fetch = vi.fn()

// Mock AbortSignal.timeout for environments that don't support it
if (!AbortSignal.timeout) {
  AbortSignal.timeout = (delay: number) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), delay)
    return controller.signal
  }
}

// Mock window.location for routing tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5173',
    origin: 'http://localhost:5173',
    protocol: 'http:',
    host: 'localhost:5173',
    hostname: 'localhost',
    port: '5173',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// Mock matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock performance.now for throttling tests
if (!global.performance) {
  global.performance = {
    now: vi.fn(() => Date.now()),
  } as any
}

// Mock navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 48.7758,
          longitude: 9.1829,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      })
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
})

// Mock URL.createObjectURL for file handling tests
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Setup test environment variables
process.env.NODE_ENV = 'test'
process.env.VITE_APP_NAME = 'RevierKompass Test'

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
}) 
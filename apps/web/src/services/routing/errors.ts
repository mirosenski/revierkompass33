export class RateLimitError extends Error {
  constructor(
    public provider: string,
    public retryAfter: number = 60 // Default 60s
  ) {
    super(`Rate limit exceeded for ${provider}`);
    this.name = 'RateLimitError';
  }
}

export class RoutingError extends Error {
  constructor(
    message: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'RoutingError';
  }
}

export class CORSError extends Error {
  constructor(public provider: string) {
    super(`CORS error for ${provider} - use proxy or fallback`);
    this.name = 'CORSError';
  }
}

export class InvalidCoordinateError extends Error {
  constructor(message: string = 'Invalid coordinates provided') {
    super(message);
    this.name = 'InvalidCoordinateError';
  }
} 
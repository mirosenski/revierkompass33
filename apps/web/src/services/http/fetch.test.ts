import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { typedFetch } from './fetch';

describe('typedFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should fetch data successfully', async () => {
    const mockResponse = { data: 'test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await typedFetch<typeof mockResponse>('https://api.test.com');
    expect(result).toEqual(mockResponse);
  });

  it('should throw error on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(typedFetch('https://api.test.com')).rejects.toThrow('HTTP 404: Not Found');
  });

  it('aborts after 8 seconds by default', async () => {
    const mockAbort = vi.fn();
    const mockAbortController = {
      signal: {},
      abort: mockAbort,
    };
    vi.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);

    const fetchPromise = typedFetch('https://api.test.com');
    
    // Fast-forward time to trigger timeout
    vi.advanceTimersByTime(8000);
    
    await expect(fetchPromise).rejects.toThrow();
    expect(mockAbort).toHaveBeenCalled();
  });

  it('aborts after custom timeout', async () => {
    const mockAbort = vi.fn();
    const mockAbortController = {
      signal: {},
      abort: mockAbort,
    };
    vi.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);

    const fetchPromise = typedFetch('https://api.test.com', undefined, 5000);
    
    // Fast-forward time to trigger timeout
    vi.advanceTimersByTime(5000);
    
    await expect(fetchPromise).rejects.toThrow();
    expect(mockAbort).toHaveBeenCalled();
  });
}); 
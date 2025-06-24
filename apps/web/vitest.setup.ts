import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './src/tests/msw/server';
import 'fake-indexeddb/auto';

// MSW: start/stop
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Fallback: stub console.error to keep test logs clean
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {}); 
import 'fake-indexeddb/auto';
import { server } from './src/tests/msw/server';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Fallback: stub console.error to keep test logs clean
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {}); 
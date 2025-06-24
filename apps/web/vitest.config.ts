import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: './vitest.setup.ts',
    environment: 'jsdom',
    testTimeout: 10000, // 10 Sekunden Timeout für alle Tests
    hookTimeout: 10000, // 10 Sekunden Timeout für Hooks
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}); 
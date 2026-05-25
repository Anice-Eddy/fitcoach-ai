import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment:  'jsdom',
    globals:      true,
    setupFiles:   ['./tests/setup.ts'],
    include:      ['tests/unit/**/*.test.ts', 'tests/api/**/*.test.ts'],
    exclude:      ['tests/e2e/**'],
    coverage: {
      provider:   'v8',
      reporter:   ['text', 'lcov', 'html'],
      include:    ['utils/**', 'lib/**', 'stores/**'],
      exclude:    ['lib/prisma/**', 'lib/auth/**', '**/*.d.ts'],
    },
  },
})

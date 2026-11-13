import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string }

export default defineConfig({
  define: {
    __ZUSOUND_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    // Run against core source so tests need no prior build and can observe core internals.
    alias: {
      '@zusound/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 73,
        statements: 80,
      },
    },
  },
})

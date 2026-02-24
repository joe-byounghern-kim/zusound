import { defineConfig } from 'tsup'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version: string }

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  treeshake: true,
  external: ['zustand'],
  noExternal: [],
  define: {
    __ZUSOUND_VERSION__: JSON.stringify(packageJson.version),
  },
})

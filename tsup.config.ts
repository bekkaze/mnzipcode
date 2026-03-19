import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
  },
  {
    entry: { react: 'src/react/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    external: ['react'],
    splitting: false,
  },
  {
    entry: { map: 'src/map/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    external: ['react', 'leaflet', 'react-leaflet'],
    splitting: false,
  },
])

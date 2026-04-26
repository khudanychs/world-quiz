import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  define: {
    __STATIC_DATA_VERSION__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      // Use sharp/svgo-backed optimization for better maintenance and quality controls.
      includePublic: true,
      cache: true,
      cacheLocation: '.cache/vite-image-optimizer',
      png: {
        quality: 82,
      },
      jpeg: {
        quality: 78,
      },
      jpg: {
        quality: 78,
      },
      webp: {
        quality: 80,
      },
      avif: {
        quality: 58,
      },
    }),
  ],
  server: {
    host: true,
  },
  build: {
    // Enable minification with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Enable module preload to prevent waterfall loading
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps) => {
        // Preload critical chunks in parallel with main script
        return deps;
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
              return 'react-core';
            }

            if (id.includes('/firebase/')) {
              return 'firebase-core';
            }

            if (id.includes('/i18next') || id.includes('/react-i18next') || id.includes('/i18next-browser-languagedetector')) {
              return 'i18n-core';
            }

            if (id.includes('/react-simple-maps/') || id.includes('/d3-geo/') || id.includes('/topojson-client/')) {
              return 'map-core';
            }
          }

          if (id.includes('/src/components/InteractiveMap.tsx')) {
            return 'map-interactive';
          }

          if (
            id.includes('/src/components/FlagMatchGame.tsx') ||
            id.includes('/src/hooks/useFlagMatchGame.ts')
          ) {
            return 'game-flag-match';
          }

          if (
            id.includes('/src/components/PhysicalGeoGame.tsx') ||
            id.includes('/src/components/physicalGeoGame/') ||
            id.includes('/src/hooks/usePhysicalGeoGame.ts')
          ) {
            return 'game-physical-geo';
          }

          if (
            id.includes('/src/components/GuessCountryGame.tsx') ||
            id.includes('/src/components/GuessResultRow.tsx')
          ) {
            return 'game-guess-country';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable source maps only for production debugging if needed
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
})
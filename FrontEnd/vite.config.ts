import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
        manualChunks: {
          // Split Firebase into its own critical chunk (preloaded)
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          // Split i18n libraries (critical for initial render)
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Split map libraries into their own chunk (loaded when map pages are accessed)
          maps: ['react-simple-maps', 'd3-geo'],
          // Split React core
          vendor: ['react', 'react-dom', 'react-router-dom'],
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
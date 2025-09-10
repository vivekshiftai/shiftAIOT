import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
  define: {
    // Ensure process.env is available for any remaining references
    'process.env': {},
    // Fix for SockJS client - provide global polyfill
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['sockjs-client', '@stomp/stompjs']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        globals: {
          global: 'globalThis'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  esbuild: {
    define: {
      global: 'globalThis'
    }
  }
})

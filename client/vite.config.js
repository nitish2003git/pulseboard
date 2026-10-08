import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies API + WebSocket traffic to the Express backend on :5000,
// so the client can use same-origin URLs and avoid CORS during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy libraries into cacheable vendor chunks.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          dnd: ['@hello-pangea/dnd'],
          realtime: ['socket.io-client'],
        },
      },
    },
  },
});

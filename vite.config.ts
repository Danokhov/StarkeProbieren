import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    // Используем переменные окружения из Netlify
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.NETLIFY_API_KEY || ""),
    // Также делаем доступным через import.meta.env для Vite
    'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.API_KEY || process.env.NETLIFY_API_KEY || "")
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: true,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild'
  }
});

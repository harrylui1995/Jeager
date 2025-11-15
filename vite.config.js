import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  envDir: '..', // Look for .env files in project root, not src/
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
    sourcemap: true,
    target: 'es2022',
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    open: true,
    cors: true,
  },
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js', 'pdfjs-dist', 'mammoth'],
  },
});

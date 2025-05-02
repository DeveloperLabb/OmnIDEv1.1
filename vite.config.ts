import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Keep using relative paths
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    },
    headers: {
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' http://localhost:8000; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // Don't use hashed filenames in Electron builds
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: undefined
      }
    },
    // Ensure sourcemaps are enabled for debugging
    sourcemap: true,
    // Improve CSS handling
    cssCodeSplit: false, // Combine all CSS into one file
    // Minify output
    minify: 'esbuild'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Enable CORS for development
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  }
});
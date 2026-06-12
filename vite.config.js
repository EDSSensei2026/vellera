import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react() // Standard, clean React compiling plugin
  ],
  resolve: {
    alias: {
      // This configures the "@/" path alias you are using throughout App.jsx
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});

import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { componentTagger } from 'lovable-tagger';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    hmr: {
      overlay: false,
    },
    host: '::',
    port: 8080,
  },
}));

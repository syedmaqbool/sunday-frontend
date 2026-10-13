import { readFileSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { componentTagger } from 'lovable-tagger';
import { defineConfig } from 'vite';

const packageJsonPath = path.resolve(import.meta.dirname, './package.json');

function getPackageVersion(): string {
  const packageMetadata = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    version: string;
  };

  return packageMetadata.version;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'html-package-version',
      transformIndexHtml(html: string) {
        return html.replaceAll('__PACKAGE_VERSION__', () => getPackageVersion());
      },
    },
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
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

// @ts-check

import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';
// Use require for Node.js modules in CommonJS context for Vite config
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: {
        'index': path.resolve(__dirname, 'src/utils/hooks/index.ts'),
        'useUnstorage': path.resolve(__dirname, 'src/utils/hooks/useUnstorage.ts'),
        'useUnstorage.signals': path.resolve(__dirname, 'src/utils/hooks/useUnstorage.signals.ts'),
        'useUnstorage.utils': path.resolve(__dirname, 'src/utils/hooks/useUnstorage.utils.ts'),
        'useHybridSignal': path.resolve(__dirname, 'src/utils/hooks/useHybridSignal.ts'),
        'useIndexedDBStorage': path.resolve(__dirname, 'src/utils/hooks/useIndexedDBStorage.ts'),
        'useIndexedDBSignal': path.resolve(__dirname, 'src/utils/hooks/useIndexedDBSignal.ts'),
        'useIndexedDBHybridSignal': path.resolve(__dirname, 'src/utils/hooks/useIndexedDBHybridSignal.ts'),
        'useIndexedDBStorage.utils': path.resolve(__dirname, 'src/utils/hooks/useIndexedDBStorage.utils.ts')
      },
      formats: ['es']
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Make sure dependencies are not bundled
      external: ['react', 'unstorage'],
      output: {
        globals: {
          react: 'React',
          unstorage: 'unstorage'
        },
        entryFileNames: '[name].js',
        manualChunks: () => 'none' // Disable code splitting into shared chunks
      }
    },
    target: 'esnext',
    minify: false
  },
  plugins: [
    typescript({
      tsconfig: path.resolve(__dirname, 'tsconfig.app.json'),
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src/utils/hooks'
    })
  ]
}); 
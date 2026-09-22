import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';

const entryName = process.env.VJR_ENTRY ?? 'index';
const entries: Record<string, string> = {
  index: 'src/index.ts',
  virtual: 'src/virtual.ts',
  headless: 'src/core/index.ts',
};

if (!(entryName in entries)) {
  throw new Error(`Unknown library entry: ${entryName}`);
}

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, entries[entryName]),
      name: 'JsonViewerReact',
      formats: ['es', 'cjs'],
      fileName: format => {
        const extension = format === 'es' ? 'js' : 'cjs';
        if (entryName === 'index') {
          return format === 'es'
            ? 'view-json-react.esm.js'
            : 'view-json-react.cjs';
        }
        return `${entryName}.${extension}`;
      },
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-runtime.js'],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
      },
      format: {
        comments: false,
      },
    },
    sourcemap: false,
    emptyOutDir: false,
  },
});

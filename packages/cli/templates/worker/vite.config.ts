import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    minify: false, // Disable minification to preserve function names
    rollupOptions: {
      output: {
        // Don't wrap in any function
        format: 'es',
        // Don't use exports
        exports: 'none',
      },
      // Disable tree-shaking to preserve all code
      treeshake: false,
    },
  },
});

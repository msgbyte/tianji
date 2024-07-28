import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    clean: true,
    dts: true,
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['cjs', 'esm'],
    minify: !options.watch,
    treeshake: false,
    tsconfig: 'tsconfig.json',
    splitting: false,
    sourcemap: true,
    external: ['react'],
  };
});

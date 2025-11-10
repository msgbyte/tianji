// import { transform as swcTransform } from '@swc/core';
import { transform as esbuildTransform } from 'esbuild';

/**
 * Transform Typescript code to ES6 code
 * @NOTICE: this fetaure has memory leak issue, temp remove it.
 */
export async function transformTypescriptCode(sourceCode: string) {
  // Commented as its maybe have memory leak issue
  // const res = await swcTransform(sourceCode, {
  //   jsc: {
  //     parser: {
  //       syntax: 'typescript',
  //       tsx: false,
  //     },
  //     target: 'esnext',
  //   },
  //   module: {
  //     type: 'es6',
  //   },
  //   minify: false,
  // });

  // return res.code;
  const res = await esbuildTransform(sourceCode, {
    loader: 'ts',
    format: 'esm',
    target: 'esnext',
    minify: false,
  });

  return res.code;
}

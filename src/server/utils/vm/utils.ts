import { transform as swcTransform } from '@swc/core';

/**
 * Transform Typescript code to ES6 code
 * @NOTICE: this fetaure has memory leak issue, temp remove it.
 */
export async function transformTypescriptCode(sourceCode: string) {
  const res = await swcTransform(sourceCode, {
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: false,
      },
      target: 'esnext',
    },
    module: {
      type: 'es6',
    },
    minify: false,
  });

  return res.code;
}

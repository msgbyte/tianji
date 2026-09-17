import { describe, expect, test } from 'vitest';
import {
  compileSharedModule,
  SharedModuleCompileError,
} from './compiler.js';

describe('compileSharedModule', () => {
  test('emits native ESM, declarations, and export metadata', async () => {
    const compiled = await compileSharedModule(`
      export interface Point { x: number; y: number }
      export function add(left: number, right: number): number {
        return left + right;
      }
    `);

    expect(compiled.compiledCode).toContain('export');
    expect(compiled.declarationCode).toContain('export declare function add');
    expect(compiled.exportsMetadata).toEqual([
      { name: 'Point', kind: 'interface' },
      { name: 'add', kind: 'function' },
    ]);
  });

  test('rejects dependencies and type errors before publish', async () => {
    await expect(
      compileSharedModule(`
        import { value } from '@shared/other';
        export const total: number = value;
      `)
    ).rejects.toBeInstanceOf(SharedModuleCompileError);

    await expect(
      compileSharedModule(`export const total: number = 'wrong';`)
    ).rejects.toThrow('not assignable to type');
  });
});


describe('compileSharedModule sandbox globals', () => {
  test('accepts worker sandbox globals such as request and kv', async () => {
    const compiled = await compileSharedModule(`
      export async function ping(url: string) {
        const res = await request({ url });
        await kv.set('last', res.status);
        console.log(res.status);
        return res.data;
      }
    `);

    expect(compiled.declarationCode).toContain('export declare function ping');
  });
});

import { describe, expect, test } from 'vitest';
import {
  canMigrateLegacyWorkerCode,
  hasModuleWorkerEntry,
  migrateLegacyWorkerCode,
} from './workerCodeMigration';

describe('worker code migration', () => {
  test('wraps a legacy function declaration without changing its body', () => {
    const code = `const greeting = 'hello';

async function fetch(payload, context) {
  const pattern = /}/g;
  return { greeting, payload, type: context.type, pattern: String(pattern) };
}
`;

    expect(migrateLegacyWorkerCode(code)).toBe(`const greeting = 'hello';

export default {
  async fetch(payload, context) {
    const pattern = /}/g;
    return { greeting, payload, type: context.type, pattern: String(pattern) };
  },
} satisfies TianjiWorker;
`);
  });

  test('wraps a legacy arrow function initializer', () => {
    expect(
      migrateLegacyWorkerCode(
        `const fetch = async (payload, context) => ({ payload, context });`
      )
    ).toBe(
      `export default {
  fetch: async (payload, context) => ({ payload, context }),
} satisfies TianjiWorker;`
    );
  });

  test('removes an unsupported export while migrating', () => {
    expect(
      migrateLegacyWorkerCode(`export async function fetch(payload) {
  return payload;
}`)
    ).toBe(`export default {
  async fetch(payload) {
    return payload;
  },
} satisfies TianjiWorker;`);
  });

  test('ignores examples in comments and strings', () => {
    const code = `// function fetch() {}
const example = 'function fetch() {}';`;
    expect(canMigrateLegacyWorkerCode(code)).toBe(false);
    expect(migrateLegacyWorkerCode(code)).toBe(code);
  });

  test('does not migrate an existing Module Worker entry', () => {
    const code = `export default { async fetch(payload) { return payload; } } satisfies TianjiWorker;`;
    expect(hasModuleWorkerEntry(code)).toBe(true);
    expect(canMigrateLegacyWorkerCode(code)).toBe(false);
    expect(migrateLegacyWorkerCode(code)).toBe(code);
  });
});

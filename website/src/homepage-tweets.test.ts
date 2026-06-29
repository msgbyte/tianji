import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const homepageSource = readFileSync(
  new URL('./pages/index.tsx', import.meta.url),
  'utf8'
);

test('does not include deleted tweets on the homepage', () => {
  assert.equal(homepageSource.includes('1852357169175318932'), false);
});

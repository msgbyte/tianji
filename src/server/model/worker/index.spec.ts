import { describe, it } from 'vitest';
import { execWorker } from './index.js';

describe('worker', () => {
  it('should exec worker', async () => {
    await execWorker('1');
  });
});

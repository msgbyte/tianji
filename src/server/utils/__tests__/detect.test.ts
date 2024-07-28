import { describe, expect, test } from 'vitest';
import { getLocation } from '../detect.js';
import fs from 'fs-extra';
import { libraryPath } from '../lib.js';

describe.runIf(fs.existsSync(libraryPath.geoPath))('detect', () => {
  describe('getLocation', () => {
    test('should detect local ip', async () => {
      const location = await getLocation('127.0.0.1');

      expect(location).toBeUndefined();
    });

    test('should detect public ip', async () => {
      const location = await getLocation('76.76.21.123');

      expect(location).toHaveProperty('country', 'US');
      expect(location).toHaveProperty('subdivision1', 'CA');
      expect(location).toHaveProperty('subdivision2', undefined);
      expect(location).toHaveProperty('city', 'Walnut');
      expect(location).toHaveProperty('longitude', -117.8512);
      expect(location).toHaveProperty('latitude', 34.0233);
      expect(location).toHaveProperty('accuracyRadius', 20);
    });
  });
});

import { describe, expect, test } from 'vitest';
import { createTestContext } from '../../tests/utils';
import { generateETag } from '../../utils/common';

describe('telemetry router', () => {
  const { app, createTestUser, createTestTelemetry } = createTestContext();

  describe('/:telemetryId.gif', () => {
    test('normal', async () => {
      const { workspace } = await createTestUser();
      const telemetry = await createTestTelemetry(workspace.id);

      const { status } = await app.get(
        `/telemetry/${workspace.id}/${telemetry.id}.gif`
      );

      expect(status).toBe(200);
    });

    test('with query', async () => {
      const { workspace } = await createTestUser();
      const telemetry = await createTestTelemetry(workspace.id);

      const { status } = await app.get(
        `/telemetry/${workspace.id}/${telemetry.id}.gif?name=tianji-oss&url=https://google.com&v=1.8.2`
      );

      expect(status).toBe(200);
    });
  });

  describe('/badge', () => {
    test('check header', async () => {
      const { workspace } = await createTestUser();
      const telemetry = await createTestTelemetry(workspace.id);

      const { header, status } = await app.get(
        `/telemetry/${workspace.id}/${telemetry.id}/badge.svg`
      );

      expect(status).toBe(200);
      expect(header['content-type']).toBe('image/svg+xml; charset=utf-8');
      expect(header['cache-control']).toBe(
        'no-cache,max-age=0,no-store,s-maxage=0,proxy-revalidate'
      );
      expect(header['etag']).toBe('"f2a1eaa06e04bf61f14a783fdc8ac38c"');
      expect(header['etag']).toBe(generateETag('visitor|0'));
    });

    test('check header change with count', async () => {
      const { workspace } = await createTestUser();
      const telemetry = await createTestTelemetry(workspace.id);

      const { header, status } = await app.get(
        `/telemetry/${workspace.id}/${telemetry.id}/badge.svg?url=https://www.google.com/`
      );

      expect(status).toBe(200);
      expect(header['etag']).toBe('"988dd9b8dab74e167225028b4b19faf7"');
      expect(header['etag']).toBe(generateETag('visitor|1'));
    });
  });
});

import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { prisma } from '../_client.js';
import { getApplicationEventStats } from './event.js';

let workspaceId: string;
let applicationId: string;
let sessionIds: string[];

beforeEach(async () => {
  const workspace = await prisma.workspace.create({
    data: { name: 'Application Event Stats Test' },
  });
  workspaceId = workspace.id;
  const application = await prisma.application.create({
    data: { workspaceId, name: 'Event Stats Test' },
  });
  applicationId = application.id;
  sessionIds = [randomUUID(), randomUUID()];
  await prisma.applicationSession.createMany({
    data: sessionIds.map((id) => ({ id, applicationId })),
  });
});

afterEach(async () => {
  if (workspaceId) {
    await prisma.workspace.delete({ where: { id: workspaceId } });
  }
});

async function addEvents(
  eventName: string | null,
  count: number,
  createdAt = '2026-07-01T12:00:00Z',
  sessionId = sessionIds[0]
) {
  await prisma.applicationEvent.createMany({
    data: Array.from({ length: count }, () => ({
      applicationId,
      sessionId,
      eventName,
      createdAt: new Date(createdAt),
    })),
  });
}

const filters = {
  startDate: new Date('2026-07-01T00:00:00Z'),
  endDate: new Date('2026-07-03T23:59:59Z'),
  timezone: 'UTC',
  unit: 'day' as const,
};

describe('application event breakdown', () => {
  test('keeps the period top nine and combines the remainder without double-counting sessions', async () => {
    for (let index = 0; index < 8; index++) {
      await addEvents(`event-${index}`, 10 + index);
    }
    await addEvents('Other', 9);
    await addEvents('tenth', 4);
    await addEvents('tenth', 4, '2026-07-03T12:00:00Z');
    await addEvents(null, 2, '2026-07-03T12:00:00Z', sessionIds[1]);
    await addEvents('outside-range', 30, '2026-06-30T12:00:00Z');

    const result = await getApplicationEventStats(applicationId, filters);

    expect(
      new Set(result.eventBreakdown.map((item) => item.eventName))
    ).toEqual(
      new Set([
        ...Array.from({ length: 8 }, (_, i) => `event-${i}`),
        'Other',
        null,
      ])
    );
    expect(
      result.eventBreakdown.filter((item) => item.eventName === null)
    ).toEqual([
      { date: '2026-07-01 00:00:00', eventName: null, eventCount: 4 },
      { date: '2026-07-03 00:00:00', eventName: null, eventCount: 6 },
    ]);
    for (const bucket of result.current) {
      expect(
        result.eventBreakdown
          .filter((item) => item.date === bucket.date)
          .reduce((sum, item) => sum + item.eventCount, 0)
      ).toBe(bucket.eventCount);
    }
    expect(result.current.map((item) => item.sessionCount)).toEqual([1, 0, 2]);
    expect(result.currentTotalSessionCount).toBe(2);
  });

  test('breaks ranking ties by name and excludes other applications', async () => {
    for (let index = 9; index >= 0; index--) {
      await addEvents(`event-${index}`, 1);
    }
    const otherApplication = await prisma.application.create({
      data: { workspaceId, name: 'Other Application' },
    });
    const otherSession = await prisma.applicationSession.create({
      data: { id: randomUUID(), applicationId: otherApplication.id },
    });
    await prisma.applicationEvent.create({
      data: {
        applicationId: otherApplication.id,
        sessionId: otherSession.id,
        eventName: 'foreign-event',
        createdAt: new Date('2026-07-01T12:00:00Z'),
      },
    });

    const result = await getApplicationEventStats(applicationId, filters);

    expect(result.eventBreakdown.map((item) => item.eventName)).toEqual([
      ...Array.from({ length: 9 }, (_, i) => `event-${i}`),
      null,
    ]);
  });

  test('aligns hourly event buckets with sessions in the requested timezone', async () => {
    await addEvents('open', 2, '2026-07-01T23:30:00Z');
    await addEvents('close', 1, '2026-07-02T01:30:00Z');

    const result = await getApplicationEventStats(applicationId, {
      startDate: new Date('2026-07-01T23:00:00Z'),
      endDate: new Date('2026-07-02T01:59:59Z'),
      timezone: 'Asia/Shanghai',
      unit: 'hour',
    });

    expect(result.eventBreakdown).toEqual([
      { date: '2026-07-02 07:00:00', eventName: 'open', eventCount: 2 },
      { date: '2026-07-02 09:00:00', eventName: 'close', eventCount: 1 },
    ]);
    expect(
      result.current.map(({ date, sessionCount }) => ({ date, sessionCount }))
    ).toEqual([
      { date: '2026-07-02 07:00:00', sessionCount: 1 },
      { date: '2026-07-02 08:00:00', sessionCount: 0 },
      { date: '2026-07-02 09:00:00', sessionCount: 1 },
    ]);
  });

  test('returns no event series for an empty range', async () => {
    const result = await getApplicationEventStats(applicationId, filters);

    expect(result.eventBreakdown).toEqual([]);
    expect(result.current).toEqual([]);
    expect(result.currentTotalSessionCount).toBe(0);
  });
});

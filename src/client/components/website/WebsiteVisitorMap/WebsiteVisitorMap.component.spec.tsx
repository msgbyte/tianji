import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { WebsiteVisitorMap } from '.';

vi.mock('../../../api/trpc', () => ({
  trpc: {
    website: {
      geoStats: {
        useQuery: () => ({ data: [] }),
      },
    },
  },
}));

vi.mock('../../../store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace-1',
}));

vi.mock('../../../hooks/useGlobalRangeDate', () => ({
  useGlobalRangeDate: () => ({
    startDate: { valueOf: () => 1 },
    endDate: { valueOf: () => 2 },
  }),
}));

vi.mock('../../../hooks/useConfig', () => ({
  useGlobalConfig: () => ({}),
}));

vi.mock('./VisitorLarkMap', () => ({
  VisitorLarkMap: ({ mapType }: { mapType: string }) => (
    <div data-testid="visitor-lark-map">{mapType}</div>
  ),
}));

describe('WebsiteVisitorMap', () => {
  test('uses MapLibre when no map API key is configured', async () => {
    render(<WebsiteVisitorMap websiteId="website-1" />);

    expect((await screen.findByTestId('visitor-lark-map')).textContent).toBe(
      'MapLibre'
    );
  });
});

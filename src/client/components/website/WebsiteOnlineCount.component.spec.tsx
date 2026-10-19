import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { WebsiteOnlineCount } from './WebsiteOnlineCount';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../api/trpc', () => ({
  trpc: {
    website: {
      onlineCount: {
        useQuery: vi.fn(() => ({ data: 3 })),
      },
    },
  },
}));

describe('WebsiteOnlineCount', () => {
  test('shows the concise online count label', () => {
    render(
      <WebsiteOnlineCount workspaceId="workspace-1" websiteId="website-1" />
    );

    expect(screen.getByText('3 online')).toBeInTheDocument();
  });
});

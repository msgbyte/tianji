import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FreeTierTip } from './FreeTierTip';

const queryState = vi.hoisted(() => ({
  currentTier: 'FREE',
  usage: {
    websiteAcceptedCount: 0,
    websiteEventCount: 0,
    monitorExecutionCount: 0,
    surveyCount: 0,
    feedEventCount: 0,
  },
  limit: {
    maxWebsiteCount: 3,
    maxWebsiteEventCount: 100_000,
    maxMonitorExecutionCount: 100_000,
    maxSurveyCount: 3,
    maxFeedChannelCount: 3,
    maxFeedEventCount: 10_000,
  },
  serviceCount: {
    website: 0,
    monitor: 0,
    survey: 0,
    page: 0,
    feed: 0,
  },
}));

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => 'workspace_1',
}));

vi.mock('@/api/trpc', () => ({
  trpc: {
    billing: {
      currentTier: {
        useQuery: vi.fn(() => ({ data: queryState.currentTier })),
      },
      usage: {
        useQuery: vi.fn(() => ({ data: queryState.usage })),
      },
      limit: {
        useQuery: vi.fn(() => ({ data: queryState.limit })),
      },
    },
    workspace: {
      getServiceCount: {
        useQuery: vi.fn(() => ({ data: queryState.serviceCount })),
      },
    },
  },
}));

vi.mock('@/hooks/useConfig', () => ({
  useGlobalConfig: () => ({ enableBilling: true }),
}));

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('./ui/alert', () => ({
  Alert: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  AlertDescription: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock('./ui/button', () => ({
  Button: ({
    children,
    Icon,
    iconType: _iconType,
    variant: _variant,
    size: _size,
    ...props
  }: React.PropsWithChildren<{
    Icon?: React.ComponentType<{ className?: string }>;
    iconType?: string;
    variant?: string;
    size?: string;
  }> &
    React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>
      {Icon ? <Icon /> : null}
      {children}
    </button>
  ),
}));

vi.mock('./ui/popover', () => ({
  Popover: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  PopoverContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

const tipText =
  'You are currently using the FREE plan. Upgrade to a higher plan to get more quota.';
const firstOpenedAtKey = 'tianji-free-tip-first-opened-at:workspace_1';
const delayedIgnoreKey = 'tianji-free-tip-ignore:free-tier-delay:workspace_1';
const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
const now = new Date('2026-06-22T00:00:00.000Z').getTime();

describe('FreeTierTip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    localStorage.clear();
    queryState.currentTier = 'FREE';
    queryState.usage = {
      websiteAcceptedCount: 0,
      websiteEventCount: 0,
      monitorExecutionCount: 0,
      surveyCount: 0,
      feedEventCount: 0,
    };
    queryState.limit = {
      maxWebsiteCount: 3,
      maxWebsiteEventCount: 100_000,
      maxMonitorExecutionCount: 100_000,
      maxSurveyCount: 3,
      maxFeedChannelCount: 3,
      maxFeedEventCount: 10_000,
    };
    queryState.serviceCount = {
      website: 0,
      monitor: 0,
      survey: 0,
      page: 0,
      feed: 0,
    };
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
  });

  test('does not show before the third day after first open when quota remains available', () => {
    render(<FreeTierTip isCollapsed={false} />);

    expect(screen.queryByText(tipText)).not.toBeInTheDocument();
  });

  test('shows on the third day after first open when quota remains available', () => {
    localStorage.setItem(firstOpenedAtKey, String(now - threeDaysMs));

    render(<FreeTierTip isCollapsed={false} />);

    expect(screen.getByText(tipText)).toBeInTheDocument();
  });

  test('shows before the third day when usage reaches a finite quota', () => {
    localStorage.setItem(firstOpenedAtKey, String(now));
    queryState.usage.websiteEventCount = 100_000;

    render(<FreeTierTip isCollapsed={false} />);

    expect(screen.getByText(tipText)).toBeInTheDocument();
  });

  test('ignoring the third-day tip does not ignore the quota-full tip', () => {
    localStorage.setItem(firstOpenedAtKey, String(now - threeDaysMs));
    render(<FreeTierTip isCollapsed={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ignore' }));
    expect(localStorage.getItem(delayedIgnoreKey)).toBe('true');

    cleanup();
    queryState.usage.websiteEventCount = 100_000;
    localStorage.setItem(firstOpenedAtKey, String(now));
    render(<FreeTierTip isCollapsed={false} />);

    expect(screen.getByText(tipText)).toBeInTheDocument();
  });
});

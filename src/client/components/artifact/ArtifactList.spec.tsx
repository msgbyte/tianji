import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ArtifactList } from './ArtifactList';

const mocks = vi.hoisted(() => ({
  workspaceId: 'workspace-a',
  list: vi.fn(),
  navigate: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));
vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => mocks.workspaceId,
}));
vi.mock('./ArtifactSkillDialog', () => ({
  ArtifactSkillDialog: () => <button>Install Skill</button>,
}));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
  useRouterState: () => ({ location: { pathname: '/artifacts/first' } }),
}));
vi.mock('@/api/trpc', () => ({
  trpc: {
    useQueries: (fn: any) => fn({ artifact: { list: mocks.list } }),
  },
}));

const first = {
  id: 'first',
  title: 'First report',
  description: '',
  updatedAt: '2026-11-07T00:00:00Z',
  path: '/artifacts/first?workspaceId=workspace-a',
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.workspaceId = 'workspace-a';
  mocks.list.mockImplementation(({ page, search }) => ({
    data: {
      items: search
        ? []
        : page === 1
          ? [first]
          : [
              {
                ...first,
                id: 'second',
                title: 'Second report',
                path: '/artifacts/second?workspaceId=workspace-a',
              },
            ],
      hasMore: page === 1 && !search,
    },
    isLoading: false,
    error: null,
    refetch: mocks.refetch,
  }));
});

test('loads more metadata, preserves workspace links and selects links with query strings', async () => {
  render(<ArtifactList />);
  const item = screen.getByRole('button', { name: /First report/ });
  expect(item).toHaveClass('bg-gray-50');
  fireEvent.click(item);
  expect(mocks.navigate).toHaveBeenCalledWith({ to: first.path });
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  expect(
    screen.getByRole('button', { name: /Second report/ })
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  fireEvent.change(screen.getByRole('textbox', { name: 'Search artifacts' }), {
    target: { value: 'absent' },
  });
  await waitFor(() =>
    expect(screen.getByText('No matching artifacts.')).toBeInTheDocument()
  );
  expect(mocks.list).toHaveBeenLastCalledWith({
    workspaceId: 'workspace-a',
    search: 'absent',
    page: 1,
    pageSize: 50,
  });
});

test('discards loaded pages when the workspace changes', () => {
  const { rerender } = render(<ArtifactList />);
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  mocks.list.mockClear();
  mocks.workspaceId = 'workspace-b';
  rerender(<ArtifactList />);
  expect(mocks.list).toHaveBeenCalledTimes(1);
  expect(mocks.list).toHaveBeenCalledWith({
    workspaceId: 'workspace-b',
    search: '',
    page: 1,
    pageSize: 50,
  });
  expect(screen.queryByRole('button', { name: /Second report/ })).toBeNull();
});

test('distinguishes request failure, loading and an empty workspace', () => {
  mocks.list.mockReturnValue({
    error: new Error('offline'),
    isLoading: false,
    refetch: mocks.refetch,
  });
  const { rerender } = render(<ArtifactList />);
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Unable to load artifacts.'
  );
  expect(screen.queryByText(/No artifacts yet/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(mocks.refetch).toHaveBeenCalled();
  mocks.list.mockReturnValue({ isLoading: true });
  rerender(<ArtifactList />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByText(/No artifacts yet/)).toBeNull();
  mocks.list.mockReturnValue({
    data: { items: [], hasMore: false },
    isLoading: false,
  });
  rerender(<ArtifactList />);
  expect(screen.getByText(/No artifacts yet/)).toBeInTheDocument();
});

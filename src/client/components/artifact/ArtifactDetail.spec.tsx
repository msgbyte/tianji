import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { ArtifactDetail } from './ArtifactDetail';

const mocks = vi.hoisted(() => ({
  workspaceId: 'workspace-a',
  admin: false,
  query: vi.fn(),
  copy: vi.fn(() => true),
  remove: vi.fn(async () => ({})),
  navigate: vi.fn(),
  invalidate: vi.fn(),
}));
vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));
vi.mock('@/store/user', () => ({
  useCurrentWorkspaceId: () => mocks.workspaceId,
  useHasAdminPermission: () => mocks.admin,
  useUserInfo: () => ({
    workspaces: ['workspace-a', 'workspace-b'].map((id) => ({
      workspace: { id, name: id },
    })),
  }),
}));
vi.mock('@/components/WorkspaceSwitcher', () => ({
  WorkspaceSwitcher: () => <button>Switch workspace</button>,
}));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock('copy-to-clipboard', () => ({ default: mocks.copy }));
vi.mock('@/api/trpc', () => ({
  defaultErrorHandler: vi.fn(),
  defaultSuccessHandler: vi.fn(),
  trpc: {
    useUtils: () => ({ artifact: { list: { invalidate: mocks.invalidate } } }),
    artifact: {
      get: { useQuery: mocks.query },
      delete: {
        useMutation: () => ({ mutateAsync: mocks.remove, isPending: false }),
      },
    },
  },
}));
const artifact = {
  id: 'artifact-a',
  workspaceId: 'workspace-a',
  title: 'Report',
  description: 'Quarterly results',
  source: '<script>parent.hacked = true</script><h1>Results</h1>',
  revision: 2,
  createdBy: { username: 'author' },
  updatedAt: '2026-11-07T00:00:00Z',
  path: '/artifacts/artifact-a?workspaceId=workspace-a',
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.workspaceId = 'workspace-a';
  mocks.admin = false;
  mocks.query.mockReturnValue({
    data: artifact,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
});

test('isolates preview and unmounts it while inspecting escaped source', async () => {
  const { container } = render(
    <ArtifactDetail artifactId="artifact-a" workspaceId="workspace-a" />
  );
  const frame = screen.getByTitle('Report');
  expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
  expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(container.querySelector('script')).toBeNull();
  await userEvent.click(screen.getByRole('tab', { name: 'Source' }));
  expect(container.querySelector('iframe')).toBeNull();
  expect(screen.getByText(artifact.source)).toBeInTheDocument();
  expect(container.querySelector('script')).toBeNull();
});

test('workspace switches immediately stop preview and do not read the wrong workspace', () => {
  const { container, rerender } = render(
    <ArtifactDetail artifactId="artifact-a" workspaceId="workspace-a" />
  );
  mocks.query.mockClear();
  mocks.workspaceId = 'workspace-b';
  rerender(
    <ArtifactDetail artifactId="artifact-a" workspaceId="workspace-a" />
  );
  expect(container.querySelector('iframe')).toBeNull();
  expect(mocks.query).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Switch workspace' })
  ).toBeInTheDocument();
  rerender(<ArtifactDetail artifactId="artifact-a" workspaceId="nonmember" />);
  expect(
    screen.getByText('You do not have access to this workspace.')
  ).toBeInTheDocument();
  expect(mocks.query).not.toHaveBeenCalled();
});

test('copies a stable workspace link and restricts deletion to administrators', async () => {
  const { rerender } = render(
    <ArtifactDetail artifactId="artifact-a" workspaceId="workspace-a" />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
  expect(mocks.copy).toHaveBeenCalledWith(
    new URL(artifact.path, window.location.origin).href
  );
  expect(screen.queryByRole('button', { name: 'Delete artifact' })).toBeNull();
  mocks.admin = true;
  rerender(
    <ArtifactDetail artifactId="artifact-a" workspaceId="workspace-a" />
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Delete artifact' })
  );
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(mocks.remove).toHaveBeenCalledWith({
    workspaceId: 'workspace-a',
    artifactId: 'artifact-a',
  });
  expect(mocks.invalidate).toHaveBeenCalled();
});

test('downloads the original HTML without the preview wrapper', async () => {
  const create = vi.fn((_blob: Blob) => 'blob:download');
  vi.stubGlobal(
    'URL',
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() })
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  try {
    render(<ArtifactDetail artifactId="artifact-a" />);
    fireEvent.click(screen.getByRole('button', { name: 'Download HTML' }));
    const blob = create.mock.calls[0][0] as Blob;
    const text = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blob);
    });
    expect(text).toBe(artifact.source);
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(
      'artifact-artifact-a.html'
    );
  } finally {
    click.mockRestore();
    vi.unstubAllGlobals();
  }
});

test.each([
  [null, true, 'Loading...'],
  [{ data: { code: 'NOT_FOUND' } }, false, 'Artifact not found.'],
  [
    { data: { code: 'FORBIDDEN' } },
    false,
    'You do not have access to this artifact.',
  ],
  [{ message: 'offline' }, false, 'Unable to load artifact.'],
])(
  'shows loading and error states without executing cached HTML: %j',
  (error, isLoading, text) => {
    mocks.query.mockReturnValue({
      data: error ? artifact : undefined,
      error,
      isLoading,
      refetch: vi.fn(),
    });
    const { container } = render(
      <ArtifactDetail artifactId="artifact-a" workspaceId="workspace-a" />
    );
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
  }
);

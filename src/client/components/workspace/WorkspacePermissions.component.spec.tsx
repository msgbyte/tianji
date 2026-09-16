import { cleanup, renderHook } from '@testing-library/react';
import { ROLES } from '@tianji/shared';
import { afterEach, expect, test, vi } from 'vitest';
import { useHasPermission, useUserStore } from '@/store/user';

vi.mock('@/api/socketio', () => ({ createSocketIOClient: vi.fn() }));

afterEach(() => {
  cleanup();
  useUserStore.setState({ info: null });
});

test.each([
  [ROLES.readOnly, [true, false, false, false]],
  [ROLES.write, [true, true, false, false]],
  [ROLES.admin, [true, true, true, false]],
  [ROLES.owner, [true, true, true, true]],
] as const)(
  '%s exposes the correct workspace permissions',
  (role, expected) => {
    useUserStore.setState({
      info: {
        currentWorkspaceId: 'workspace-id',
        workspaces: [{ role, workspace: { id: 'workspace-id' } }],
      } as any,
    });
    const { result } = renderHook(() => [
      useHasPermission(ROLES.readOnly),
      useHasPermission(ROLES.write),
      useHasPermission(ROLES.admin),
      useHasPermission(ROLES.owner),
    ]);
    expect(result.current).toEqual(expected);
  }
);

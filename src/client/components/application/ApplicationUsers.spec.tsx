import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { ApplicationUsers } from './ApplicationUsers';

const { usersQuery, fieldsQuery, refreshUsers, refreshFields } = vi.hoisted(
  () => ({
    usersQuery: vi.fn(),
    fieldsQuery: vi.fn(),
    refreshUsers: vi.fn(),
    refreshFields: vi.fn(),
  })
);
vi.mock('@i18next-toolkit/react', () => ({
  t: (key: string) => key,
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/api/trpc', () => ({
  trpc: {
    application: {
      users: { useQuery: usersQuery },
      userFields: { useQuery: fieldsQuery },
    },
  },
}));
vi.mock('@/store/user', () => ({ useCurrentWorkspaceId: () => 'workspace' }));

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  fieldsQuery.mockReturnValue({
    data: ['joinedGroup', 'plan'],
    refetch: refreshFields,
  });
  usersQuery.mockReturnValue({
    data: {
      total: 125,
      totalPages: 7,
      identifiedTotal: 200,
      items: [
        {
          userId: 'member',
          updatedAt: '2026-11-12T12:00:00.000Z',
          properties: { joinedGroup: true, plan: 'premium' },
        },
      ],
    },
    refetch: refreshUsers,
  });
});

async function select(label: string, option: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), {
    key: 'Enter',
  });
  fireEvent.click(await screen.findByRole('option', { name: option }));
}

test('filters typed Identify values, resets pagination, and shows full counts', async () => {
  render(<ApplicationUsers applicationId="app" />);
  expect(screen.getByText('125')).toBeInTheDocument();
  expect(screen.getByText('200')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Apply filter' })).toBeDisabled();
  fireEvent.click(screen.getByRole('link', { name: 'Go to next page' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 2 })
  );

  fireEvent.change(screen.getByLabelText('Identify field'), {
    target: { value: 'joinedGroup' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));
  expect(usersQuery).toHaveBeenLastCalledWith({
    workspaceId: 'workspace',
    applicationId: 'app',
    page: 1,
    pageSize: 20,
    filter: { field: 'joinedGroup', value: true },
  });
  expect(screen.getByText('joinedGroup = true')).toBeInTheDocument();

  await select('Value type', 'String');
  fireEvent.change(screen.getByLabelText('Value', { exact: true }), {
    target: { value: 'true' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: { field: 'joinedGroup', value: 'true' } })
  );

  await select('Value type', 'Number');
  expect(screen.getByRole('button', { name: 'Apply filter' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Value', { exact: true }), {
    target: { value: '0' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: { field: 'joinedGroup', value: 0 } })
  );

  await select('Value type', 'Null');
  fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: { field: 'joinedGroup', value: null } })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ filter: undefined, page: 1 })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(refreshUsers).toHaveBeenCalledOnce();
  expect(refreshFields).toHaveBeenCalledOnce();
});

test.each([{ isFetching: true }, { isError: true }, { data: ['joinedGroup'] }])(
  'filters an unsuggested field when suggestions are %j',
  (suggestions) => {
    fieldsQuery.mockReturnValue(suggestions);
    render(<ApplicationUsers applicationId="app" />);
    fireEvent.change(screen.getByLabelText('Identify field'), {
      target: { value: 'groups.rare' },
    });
    const applyButton = screen.getByRole('button', { name: 'Apply filter' });
    expect(applyButton).toBeEnabled();
    fireEvent.click(applyButton);
    expect(usersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ filter: { field: 'groups.rare', value: true } })
    );
  }
);

test('distinguishes empty results from query failures', () => {
  usersQuery.mockReturnValue({
    data: { total: 0, totalPages: 0, identifiedTotal: 0, items: [] },
  });
  const { rerender } = render(<ApplicationUsers applicationId="app" />);
  expect(screen.getByText(/No identified users yet/)).toBeInTheDocument();
  usersQuery.mockReturnValue({
    data: { total: 0, totalPages: 0, identifiedTotal: 20, items: [] },
  });
  rerender(<ApplicationUsers applicationId="app" />);
  expect(screen.getByText('No users match this filter.')).toBeInTheDocument();
  usersQuery.mockReturnValue({ isError: true });
  fieldsQuery.mockReturnValue({ isError: true });
  rerender(<ApplicationUsers applicationId="app" />);
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  expect(screen.queryByText('Matching users')).not.toBeInTheDocument();
});

test('returns to a valid page when the current membership shrinks', () => {
  const { rerender } = render(<ApplicationUsers applicationId="app" />);
  fireEvent.click(screen.getByRole('link', { name: 'Go to next page' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 2 })
  );
  usersQuery.mockReturnValue({
    data: { total: 1, totalPages: 1, identifiedTotal: 200, items: [] },
  });
  rerender(<ApplicationUsers applicationId="app" />);
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1 })
  );
});

test('uses the server page limit without reducing the matching user count', () => {
  usersQuery.mockReturnValue({
    data: {
      total: 20_000_001,
      totalPages: 1_000_000,
      identifiedTotal: 20_000_001,
      items: [],
    },
  });
  render(<ApplicationUsers applicationId="app" />);
  expect(
    screen.queryByRole('link', { name: '1000001' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: '1000000' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1_000_000 })
  );
  expect(screen.getByRole('link', { name: 'Go to next page' })).toHaveAttribute(
    'aria-disabled',
    'true'
  );
  expect(screen.getAllByText((20_000_001).toLocaleString())).toHaveLength(2);
  expect(screen.getByText(/Counts include all matches/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: '1' }));
  expect(usersQuery).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1 })
  );
});

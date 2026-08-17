import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { UserSelect } from './UserSelect';

describe('UserSelect', () => {
  test('renders the selected user name and avatar fallback', async () => {
    render(
      <UserSelect
        value="user123"
        onValueChange={vi.fn()}
        users={[
          {
            id: 'user123',
            username: 'alice',
            nickname: 'Alice Team',
            avatar: null,
          },
        ]}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Alice Team');
    expect(await screen.findByText('AL')).toBeInTheDocument();
  });
});

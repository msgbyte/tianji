import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { AlertConfirm } from './AlertConfirm';
import { Button } from './ui/button';
import { SimpleTooltip, TooltipProvider } from './ui/tooltip';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('AlertConfirm trigger composition', () => {
  test('opens and confirms when its trigger is wrapped by SimpleTooltip', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <TooltipProvider>
        <AlertConfirm
          title="Rollback revision"
          description="Restore this revision"
          onConfirm={onConfirm}
        >
          <SimpleTooltip content="Rollback">
            <Button type="button">Rollback</Button>
          </SimpleTooltip>
        </AlertConfirm>
      </TooltipProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Rollback' }));
    expect(
      screen.getByRole('heading', { name: 'Rollback revision' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

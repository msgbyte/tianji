import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WebsiteActionsMenu } from './WebsiteActionsMenu';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('WebsiteActionsMenu', () => {
  test('groups retention, Lighthouse, and sharing under More', async () => {
    const user = userEvent.setup();
    const onRetention = vi.fn();
    const onLighthouse = vi.fn();
    const onShare = vi.fn();

    render(
      <WebsiteActionsMenu
        onRetention={onRetention}
        onLighthouse={onLighthouse}
        onShare={onShare}
      />
    );

    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('menuitem', { name: 'Visitor retention' }));
    expect(onRetention).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(
      screen.getByRole('menuitem', { name: 'Website Lighthouse Reports' })
    );
    expect(onLighthouse).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('menuitem', { name: 'Share' }));
    expect(onShare).toHaveBeenCalledOnce();
  });

  test('explains why sharing is disabled', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <WebsiteActionsMenu
          onRetention={vi.fn()}
          onLighthouse={vi.fn()}
        />
      </TooltipProvider>
    );

    await user.click(screen.getByRole('button', { name: 'More' }));
    const shareItem = screen.getByRole('menuitem', { name: 'Share' });
    expect(shareItem).toHaveAttribute('data-disabled');

    await user.hover(shareItem.parentElement!);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Public share is disabled for this website'
    );
  });
});

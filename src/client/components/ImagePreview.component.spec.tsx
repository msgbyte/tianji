import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ImagePreview } from './ImagePreview';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';

vi.mock('@i18next-toolkit/react', () => ({
  t: (key: string) => (key === 'Close' ? 'Cerrar' : key),
}));

beforeEach(() => {
  const getComputedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) =>
    getComputedStyle(element)
  );
});

afterEach(() => vi.restoreAllMocks());

test.each(['page', 'dialog'])(
  'isolates previews and restores focus and scroll locks in a %s',
  async (container) => {
    const images = (
      <>
        {['Primera imagen', 'Segunda imagen'].map((alt, index) => (
          <ImagePreview
            key={alt}
            src={`https://example.com/imagen-${index}.png`}
            alt={alt}
            width={24}
            height={24}
          />
        ))}
      </>
    );

    render(
      container === 'dialog' ? (
        <Dialog defaultOpen>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Detalles de la encuesta</DialogTitle>
            {images}
          </DialogContent>
        </Dialog>
      ) : (
        images
      )
    );

    const initialScrollLock = document.body.getAttribute('data-scroll-locked');
    const initialPointerEvents = document.body.style.pointerEvents;

    for (const [index, alt] of ['Primera imagen', 'Segunda imagen'].entries()) {
      const trigger = screen.getByRole('button', { name: alt });
      await userEvent.click(trigger);

      const preview = screen.getByRole('dialog', { name: alt });
      expect(preview.querySelector('.ant-image-preview-img')).toHaveAttribute(
        'src',
        `https://example.com/imagen-${index}.png`
      );
      expect(document.body).toHaveAttribute('data-scroll-locked');
      await waitFor(() =>
        expect(preview.contains(document.activeElement)).toBe(true)
      );

      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: alt })
        ).not.toBeInTheDocument();
        expect(document.body.getAttribute('data-scroll-locked')).toBe(
          initialScrollLock
        );
        expect(document.body.style.pointerEvents).toBe(initialPointerEvents);
        expect(trigger).toHaveFocus();
      });
    }

    if (container === 'dialog') {
      expect(
        screen.getByRole('dialog', { name: 'Detalles de la encuesta' })
      ).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
    }
  }
);

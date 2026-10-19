import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LayeredSelect } from './LayeredSelect';
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

test.each([true, false])(
  'keeps multiple selection interactive and closes one layer at a time (modal=%s)',
  async (modal) => {
    const onChange = vi.fn();
    render(
      <ConfigProvider getPopupContainer={() => document.body}>
        <Dialog defaultOpen modal={modal}>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Editar ruta</DialogTitle>
            <LayeredSelect mode="multiple" onChange={onChange}>
              <LayeredSelect.OptGroup label="Errores del cliente">
                <LayeredSelect.Option value={408}>
                  Tiempo agotado
                </LayeredSelect.Option>
                <LayeredSelect.Option value={429}>
                  Demasiadas solicitudes
                </LayeredSelect.Option>
              </LayeredSelect.OptGroup>
            </LayeredSelect>
            <button type="button">Guardar</button>
          </DialogContent>
        </Dialog>
      </ConfigProvider>
    );

    const dialog = screen.getByRole('dialog', { name: 'Editar ruta' });
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    const option = await screen.findByText('Tiempo agotado');
    expect(dialog).toContainElement(option);
    await userEvent.click(option);
    expect(onChange.mock.lastCall?.[0]).toEqual([408]);
    await userEvent.click(screen.getByText('Demasiadas solicitudes'));
    expect(onChange.mock.lastCall?.[0]).toEqual([408, 429]);

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(input).toHaveAttribute('aria-expanded', 'false')
    );
    expect(dialog).toBeVisible();
    expect(input).toHaveFocus();

    // A retained, hidden Ant popup must not keep a Radix layer registered.
    await userEvent.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(input).toHaveAttribute('aria-expanded', 'false')
    );
    expect(dialog).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(document.body.style.pointerEvents).toBe('');
  }
);

test('preserves custom tags and controlled dropdown visibility', async () => {
  function Categories() {
    const [value, setValue] = React.useState<string[]>([]);
    const [open, setOpen] = React.useState(false);
    return (
      <LayeredSelect
        mode="tags"
        value={value}
        onChange={setValue}
        open={open}
        onDropdownVisibleChange={setOpen}
        maxTagCount={2}
      />
    );
  }

  render(
    <Dialog defaultOpen modal={false}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Resumen de la encuesta</DialogTitle>
        <Categories />
      </DialogContent>
    </Dialog>
  );

  const dialog = screen.getByRole('dialog', { name: 'Resumen de la encuesta' });
  const input = screen.getByRole('combobox');
  await userEvent.type(input, 'Satisfacción');
  await userEvent.click(
    screen.getByText('Satisfacción', {
      selector: '.ant-select-item-option-content',
    })
  );
  expect(dialog.querySelector('.ant-select-selection-item')).toHaveTextContent(
    'Satisfacción'
  );
  await userEvent.type(input, 'Calidad');
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
  expect(dialog).toBeVisible();
  expect(input).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
});

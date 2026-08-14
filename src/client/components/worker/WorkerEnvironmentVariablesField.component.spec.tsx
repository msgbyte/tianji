import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, test, vi } from 'vitest';
import { Form } from '@/components/ui/form';
import type { WorkerEditFormValues } from './WorkerEditForm';
import {
  WorkerEnvironmentVariablesField,
  type WorkerEnvironmentVariableFormValue,
} from './WorkerEnvironmentVariablesField';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/select', () => {
  const SelectValueChangeContext = React.createContext<{
    value: string;
    onValueChange?: (value: string) => void;
  }>({ value: '' });

  return {
    Select: ({
      children,
      onValueChange,
      value,
    }: React.PropsWithChildren<{
      onValueChange?: (value: string) => void;
      value?: string;
    }>) => (
      <SelectValueChangeContext.Provider
        value={{ value: value ?? '', onValueChange }}
      >
        <div>{children}</div>
      </SelectValueChangeContext.Provider>
    ),
    SelectContent: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: React.PropsWithChildren<{ value: string }>) => {
      const context = React.useContext(SelectValueChangeContext);

      return (
        <button
          aria-selected={context.value === value}
          role="option"
          type="button"
          onClick={() => context.onValueChange?.(value)}
        >
          {children}
        </button>
      );
    },
    SelectTrigger: React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement>
    >(({ children, ...props }, ref) => (
      <button ref={ref} type="button" {...props}>
        {children}
      </button>
    )),
    SelectValue: () => {
      const context = React.useContext(SelectValueChangeContext);
      return <span>{context.value}</span>;
    },
  };
});

function EnvironmentFieldsTestForm({
  defaultValues,
  onSubmit = vi.fn(),
}: {
  defaultValues: WorkerEnvironmentVariableFormValue[];
  onSubmit?: (values: WorkerEnvironmentVariableFormValue[]) => void;
}) {
  const form = useForm<WorkerEditFormValues>({
    defaultValues: { environmentVariables: defaultValues },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit(values.environmentVariables)
        )}
      >
        <WorkerEnvironmentVariablesField />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
}

function renderEnvironmentFields(
  defaultValues: WorkerEnvironmentVariableFormValue[],
  onSubmit?: (values: WorkerEnvironmentVariableFormValue[]) => void
) {
  return render(
    <EnvironmentFieldsTestForm
      defaultValues={defaultValues}
      onSubmit={onSubmit}
    />
  );
}

describe('WorkerEnvironmentVariablesField', () => {
  test('shows a Text value but never populates an existing Secret input', () => {
    renderEnvironmentFields([
      {
        id: 'text',
        key: 'API_URL',
        type: 'Text',
        value: 'https://example.com',
      },
      { id: 'secret', key: 'TOKEN', type: 'Secret', hasValue: true },
    ]);

    expect(screen.getByDisplayValue('https://example.com')).toBeVisible();
    expect(screen.getByLabelText('TOKEN value')).toHaveValue('');
    expect(screen.getByLabelText('TOKEN value')).toHaveAttribute(
      'type',
      'password'
    );
    expect(screen.queryByDisplayValue('never-return')).not.toBeInTheDocument();
    expect(screen.getByText('A secret value is configured')).toBeVisible();
  });

  test('submits only an explicitly entered Secret replacement', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderEnvironmentFields(
      [{ id: 'secret', key: 'TOKEN', type: 'Secret', hasValue: true }],
      onSubmit
    );

    await user.type(screen.getByLabelText('TOKEN value'), 'replacement');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith([
      {
        id: 'secret',
        key: 'TOKEN',
        type: 'Secret',
        hasValue: true,
        value: 'replacement',
      },
    ]);
  });

  test('omits the value when an existing Secret is left blank', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderEnvironmentFields(
      [{ id: 'secret', key: 'TOKEN', type: 'Secret', hasValue: true }],
      onSubmit
    );

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledWith([
      {
        id: 'secret',
        key: 'TOKEN',
        type: 'Secret',
        hasValue: true,
      },
    ]);
  });

  test('adds and removes environment variable rows', async () => {
    const user = userEvent.setup();
    renderEnvironmentFields([]);

    await user.click(
      screen.getByRole('button', { name: 'Add Environment Variable' })
    );
    expect(
      screen.getByLabelText('Environment variable 1 key')
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Remove environment variable 1' })
    );
    expect(
      screen.queryByLabelText('Environment variable 1 key')
    ).not.toBeInTheDocument();
  });

  test('clears the old value and requires a fresh value when type changes', async () => {
    const user = userEvent.setup();
    renderEnvironmentFields([
      { id: 'text', key: 'TOKEN', type: 'Text', value: 'old-text' },
    ]);

    await user.click(screen.getByRole('option', { name: 'Secret' }));

    expect(screen.getByLabelText('TOKEN value')).toHaveValue('');
    expect(screen.getByLabelText('TOKEN value')).toBeRequired();
    expect(
      screen.queryByText('A secret value is configured')
    ).not.toBeInTheDocument();
  });
});

import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { SurveyEditForm } from './SurveyEditForm';

vi.mock('@i18next-toolkit/react', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/form')>();

  return {
    ...actual,
    FormLabel: ({
      children,
      optional: _optional,
      ...props
    }: React.PropsWithChildren<
      React.LabelHTMLAttributes<HTMLLabelElement> & { optional?: boolean }
    >) => <label {...props}>{children}</label>,
  };
});

vi.mock('../feed/FeedChannelPicker', () => ({
  FeedChannelPicker: React.forwardRef<
    HTMLSelectElement,
    React.SelectHTMLAttributes<HTMLSelectElement> & {
      allowClear?: boolean;
      mode?: string;
    }
  >(({ allowClear: _allowClear, mode, ...props }, ref) => (
    <select ref={ref} multiple={mode === 'multiple'} {...props} />
  )),
}));

vi.mock('@/components/ui/select', () => {
  const SelectValueChangeContext = React.createContext<{
    value: string;
    onValueChange?: (value: string) => void;
  }>({
    value: '',
  });

  const labels: Record<string, string> = {
    text: 'Text',
    email: 'Email',
    url: 'Url',
    imageUrl: 'Image Url',
    hidden: 'Hidden Field',
    select: 'Select',
  };

  return {
    Select: ({
      children,
      defaultValue,
      onValueChange,
      value,
    }: React.PropsWithChildren<{
      defaultValue?: string;
      onValueChange?: (value: string) => void;
      value?: string;
    }>) => {
      const currentValue = value ?? defaultValue ?? '';

      return (
        <SelectValueChangeContext.Provider
          value={{ value: currentValue, onValueChange }}
        >
          <div data-testid="mock-select-root" data-value={currentValue}>
            {children}
          </div>
        </SelectValueChangeContext.Provider>
      );
    },
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
          data-value={value}
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
    SelectValue: ({ placeholder }: { placeholder?: string }) => {
      const context = React.useContext(SelectValueChangeContext);

      return (
        <span data-testid="mock-select-value">
          {labels[context.value] ?? placeholder}
        </span>
      );
    },
  };
});

describe('SurveyEditForm', () => {
  test('renders an existing field type from edit defaults', () => {
    render(
      <SurveyEditForm
        defaultValues={{
          name: 'Customer Survey',
          desc: '',
          payload: {
            items: [
              {
                label: 'Email',
                name: 'email',
                type: 'email',
              },
            ],
          },
          feedChannelIds: [],
          feedTemplate: '',
          webhookUrl: '',
        }}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByTestId('mock-select-root')).toHaveAttribute(
      'data-value',
      'email'
    );
    expect(screen.getByTestId('mock-select-value')).toHaveTextContent('Email');
  });
});

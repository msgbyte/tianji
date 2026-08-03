import * as React from 'react';
import { LuX } from 'react-icons/lu';
import { cn } from '@/utils/style';
import { Input } from './input';
import { t } from '@i18next-toolkit/react';

export interface SecretInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange'
  > {
  value?: string | null;
  onChange?: (value: string) => void;
  /**
   * The placeholder to show when the field has an existing value.
   * @default "******"
   */
  maskPlaceholder?: string;
  /**
   * Whether to allow clearing the existing value via the clear button.
   * @default true
   */
  allowClear?: boolean;
}

/**
 * SecretInput - A secure input for sensitive data like API keys.
 *
 * Shows a masked placeholder (******) when there's an existing value, but keeps
 * the field empty until the user types — so the existing secret is never exposed.
 * Only emits a new value when the user actually enters one.
 */
const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  (
    {
      className,
      value,
      onChange,
      maskPlaceholder = '******',
      placeholder,
      allowClear = true,
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);

    const hasExistingValue = Boolean(value);
    const showMask =
      hasExistingValue && !isFocused && internalValue === '';
    const showClearBtn =
      allowClear && !disabled && (hasExistingValue || internalValue !== '');

    const handleChange = (next: string) => {
      setInternalValue(next);
      onChange?.(next);
    };

    return (
      <div className="relative w-full">
        <Input
          {...props}
          ref={ref}
          type="password"
          className={cn(showClearBtn && 'pr-8', className)}
          value={internalValue}
          placeholder={showMask ? maskPlaceholder : placeholder}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
        />
        {showClearBtn && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={t('Clear')}
            onClick={(e) => {
              e.preventDefault();
              handleChange('');
            }}
            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LuX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);
SecretInput.displayName = 'SecretInput';

export { SecretInput };

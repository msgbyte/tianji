import * as React from 'react';
import { cn } from '@/utils/style';

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
}

/**
 * SecretInput - A secure input component for sensitive data like API keys
 *
 * Features:
 * - Shows masked placeholder (******) when there's an existing value
 * - Actual field value is empty until user starts typing
 * - Clears the masked placeholder on focus
 * - Only submits new value if user has entered something
 * - Perfect for edit forms where you don't want to expose existing secrets
 *
 * @example
 * ```tsx
 * <SecretInput
 *   value={existingApiKey}
 *   onChange={(newValue) => setApiKey(newValue)}
 *   placeholder="Enter your API key"
 * />
 * ```
 */
const SecretInput = React.forwardRef<HTMLInputElement, SecretInputProps>(
  (
    {
      className,
      value,
      onChange,
      maskPlaceholder = '******',
      placeholder,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasBeenTouched, setHasBeenTouched] = React.useState(false);

    // Check if there's an existing value (from props)
    const hasExistingValue = Boolean(value);

    // Determine what placeholder to show
    const effectivePlaceholder = React.useMemo(() => {
      if (hasBeenTouched) {
        // After user has interacted, show normal placeholder
        return placeholder;
      }
      if (hasExistingValue && !isFocused) {
        // Show masked placeholder when there's existing value and not focused
        return maskPlaceholder;
      }
      // Show normal placeholder
      return placeholder;
    }, [
      hasBeenTouched,
      hasExistingValue,
      isFocused,
      placeholder,
      maskPlaceholder,
    ]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setHasBeenTouched(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      setHasBeenTouched(true);
      onChange?.(newValue);
    };

    return (
      <input
        type="password"
        className={cn(
          'flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300',
          className
        )}
        ref={ref}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={effectivePlaceholder}
        {...props}
      />
    );
  }
);
SecretInput.displayName = 'SecretInput';

export { SecretInput };

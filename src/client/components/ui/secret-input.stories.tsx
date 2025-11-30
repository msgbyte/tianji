import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SecretInput } from './secret-input';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Button } from './button';

const meta = {
  title: 'Components/UI/SecretInput',
  component: SecretInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A secure input component for sensitive data like API keys. Shows a masked placeholder when there is an existing value, clears on focus, and only submits new values when user types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The existing secret value (will be hidden)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no value or after focus',
    },
    maskPlaceholder: {
      control: 'text',
      description: 'Placeholder text shown when there is an existing value',
    },
    onChange: {
      description: 'Callback when user types a new value',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
  },
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof SecretInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with no existing value - shows normal placeholder
 */
export const Empty: Story = {
  args: {
    value: null,
    placeholder: 'Enter your API key',
  },
};

/**
 * With an existing secret value - shows masked placeholder (******)
 * Click to focus and the placeholder will change to normal text
 */
export const WithExistingValue: Story = {
  args: {
    value: 'sk-1234567890abcdef',
    placeholder: 'Enter new API key',
  },
};

/**
 * Custom mask placeholder - use bullet points or other characters
 */
export const CustomMaskPlaceholder: Story = {
  args: {
    value: 'existing-secret-key-value',
    placeholder: 'Enter new value',
    maskPlaceholder: '••••••••••••••••',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    value: 'existing-key',
    placeholder: 'Enter API key',
    disabled: true,
  },
};

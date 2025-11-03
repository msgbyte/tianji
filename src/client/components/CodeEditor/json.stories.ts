import type { Meta, StoryObj } from '@storybook/react-vite';
import { JsonEditor } from './json';

// Sample JSON data
const simpleJson = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}`;

// Sample JSON schema for validation
const personSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Person name',
    },
    age: {
      type: 'number',
      minimum: 0,
      maximum: 150,
      description: 'Person age',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Email address',
    },
  },
  required: ['name', 'email'],
};

const meta = {
  title: 'Components/CodeEditor/JsonEditor',
  component: JsonEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A Monaco-based JSON editor component with schema validation, auto-formatting, and syntax highlighting.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'JSON content as string',
    },
    height: {
      control: { type: 'text' },
      description:
        'Height of the editor (number in pixels or string with unit)',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the editor is read-only',
    },
    schema: {
      control: 'object',
      description: 'JSON Schema for validation',
    },
    onChange: {
      description: 'Callback when JSON content changes',
    },
    onValidate: {
      description: 'Callback when validation markers change',
    },
  },
  args: {
    height: 400,
    readOnly: false,
    onChange: () => {},
  },
} satisfies Meta<typeof JsonEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple JSON
export const Default: Story = {
  args: {
    value: simpleJson,
  },
};

// With schema validation
export const WithSchema: Story = {
  args: {
    value: simpleJson,
    schema: personSchema,
  },
};

// Read-only mode
export const ReadOnly: Story = {
  args: {
    value: simpleJson,
    readOnly: true,
  },
};

// With validation callback
export const WithValidation: Story = {
  args: {
    value: simpleJson,
    schema: personSchema,
    onValidate: (markers: any[]) => {
      console.log('Validation markers:', markers);
    },
  },
};

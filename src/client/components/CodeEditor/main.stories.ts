import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeEditor } from './main';

const javascriptCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}

const cart = [
  { name: 'Apple', price: 1.5, quantity: 3 },
  { name: 'Banana', price: 0.8, quantity: 5 },
];

console.log('Total:', calculateTotal(cart));`;

const meta = {
  title: 'Components/CodeEditor/CodeEditor',
  component: CodeEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A Monaco-based code editor component supporting multiple languages with syntax highlighting, validation, and auto-completion.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    height: {
      control: { type: 'text' },
      description:
        'Height of the editor (number in pixels or string with unit)',
    },
    value: {
      control: 'text',
      description: 'The code content',
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the editor is read-only',
    },
    language: {
      control: 'select',
      options: [
        'typescript',
        'javascript',
        'json',
        'python',
        'sql',
        'html',
        'css',
      ],
      description: 'Programming language for syntax highlighting',
    },
    onChange: {
      description: 'Callback when code content changes',
    },
    codeValidator: {
      description: 'Array of validator functions',
    },
  },
  args: {
    height: 400,
    readOnly: false,
    language: 'typescript',
  },
} satisfies Meta<typeof CodeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// JavaScript editor
export const Default: Story = {
  args: {
    value: javascriptCode,
    language: 'javascript',
  },
};

// Read-only mode
export const ReadOnly: Story = {
  args: {
    value: javascriptCode,
    language: 'typescript',
    readOnly: true,
  },
};

// With onChange handler
export const WithOnChange: Story = {
  args: {
    value: '// Type something here...\n',
    language: 'typescript',
    onChange: (code: string) => {
      console.log('Code changed:', code);
    },
  },
};

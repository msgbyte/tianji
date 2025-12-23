import type { Meta, StoryObj } from '@storybook/react-vite';
import { HtmlEditor } from './html';

// Sample HTML data
const simpleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a sample HTML document.</p>
</body>
</html>`;

const componentHtml = `<div class="container">
  <header>
    <nav>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <section>
      <h2>Welcome</h2>
      <p>This is a component example.</p>
    </section>
  </main>
  <footer>
    <p>&copy; 2024 Example Site</p>
  </footer>
</div>`;

const formHtml = `<form action="/submit" method="post">
  <div class="form-group">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>
  </div>
  <div class="form-group">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
  </div>
  <div class="form-group">
    <label for="message">Message:</label>
    <textarea id="message" name="message" rows="5"></textarea>
  </div>
  <button type="submit">Submit</button>
</form>`;

const meta = {
  title: 'Components/CodeEditor/HtmlEditor',
  component: HtmlEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A Monaco-based HTML editor component with syntax highlighting, auto-formatting, Emmet abbreviations support, and HTML5 validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'HTML content as string',
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
    onChange: {
      description: 'Callback when HTML content changes',
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
} satisfies Meta<typeof HtmlEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple HTML document
export const Default: Story = {
  args: {
    value: simpleHtml,
  },
};

// HTML component/snippet
export const Component: Story = {
  args: {
    value: componentHtml,
  },
};

// HTML form
export const Form: Story = {
  args: {
    value: formHtml,
  },
};

// Read-only mode
export const ReadOnly: Story = {
  args: {
    value: simpleHtml,
    readOnly: true,
  },
};

// Custom height
export const CustomHeight: Story = {
  args: {
    value: componentHtml,
    height: 600,
  },
};

// With validation callback
export const WithValidation: Story = {
  args: {
    value: simpleHtml,
    onValidate: (markers: any[]) => {
      console.log('Validation markers:', markers);
    },
  },
};

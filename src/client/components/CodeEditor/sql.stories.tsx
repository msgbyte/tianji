import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { SQLEditor, SQLTableSchema } from './index';

const meta = {
  title: 'Components/CodeEditor/SQLEditor',
  component: SQLEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SQLEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample table schemas for demonstrations
const sampleTables: SQLTableSchema[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'INTEGER', description: 'Primary key' },
      { name: 'name', type: 'VARCHAR(255)', description: 'User full name' },
      {
        name: 'email',
        type: 'VARCHAR(255)',
        description: 'User email address',
      },
      { name: 'age', type: 'INTEGER', description: 'User age' },
      {
        name: 'active',
        type: 'BOOLEAN',
        description: 'Whether user is active',
      },
      {
        name: 'created_at',
        type: 'TIMESTAMP',
        description: 'Account creation time',
      },
    ],
  },
  {
    name: 'orders',
    columns: [
      { name: 'order_id', type: 'INTEGER', description: 'Primary key' },
      {
        name: 'user_id',
        type: 'INTEGER',
        description: 'Foreign key to users table',
      },
      {
        name: 'total_amount',
        type: 'DECIMAL(10,2)',
        description: 'Order total amount',
      },
      { name: 'status', type: 'VARCHAR(50)', description: 'Order status' },
      {
        name: 'created_at',
        type: 'TIMESTAMP',
        description: 'Order creation time',
      },
    ],
  },
  {
    name: 'products',
    columns: [
      { name: 'product_id', type: 'INTEGER', description: 'Primary key' },
      { name: 'name', type: 'VARCHAR(255)', description: 'Product name' },
      { name: 'price', type: 'DECIMAL(10,2)', description: 'Product price' },
      { name: 'stock', type: 'INTEGER', description: 'Available stock' },
      {
        name: 'category',
        type: 'VARCHAR(100)',
        description: 'Product category',
      },
    ],
  },
];

// Wrapper component for interactive stories
const InteractiveSQLEditor = (props: any) => {
  const [value, setValue] = useState(props.value || '');

  return (
    <div className="space-y-4">
      <SQLEditor {...props} value={value} onChange={setValue} />
      <div className="text-muted-foreground text-sm">
        <p>Tips:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Type to see SQL keyword suggestions</li>
          <li>Type a table name followed by "." to see column suggestions</li>
          <li>Hover over table/column names to see details</li>
          <li>Press Ctrl+Space to manually trigger autocomplete</li>
        </ul>
      </div>
    </div>
  );
};

// Story 1: Basic Editor
export const Basic: Story = {
  render: () => <InteractiveSQLEditor height="300px" />,
};

// Story 2: With Tables
export const WithTables: Story = {
  render: () => (
    <InteractiveSQLEditor
      height="400px"
      tables={sampleTables}
      value={`-- Try typing table names or SQL keywords
SELECT * FROM users;`}
    />
  ),
};

// Story 3: Complex Query
export const ComplexQuery: Story = {
  render: () => (
    <InteractiveSQLEditor
      height="500px"
      tables={sampleTables}
      value={`-- Complex JOIN query example
SELECT
  users.id,
  users.name,
  users.email,
  COUNT(orders.order_id) as order_count,
  SUM(orders.total_amount) as total_spent
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.active = true
  AND users.created_at >= '2024-01-01'
GROUP BY users.id, users.name, users.email
HAVING COUNT(orders.order_id) > 0
ORDER BY total_spent DESC
LIMIT 10;`}
    />
  ),
};

// Story 4: Read Only
export const ReadOnly: Story = {
  render: () => (
    <SQLEditor
      height="300px"
      readOnly={true}
      value={`-- This is a read-only SQL viewer
SELECT
  product_id,
  name,
  price
FROM products
WHERE stock > 0
ORDER BY price DESC;`}
    />
  ),
};

// Story 5: Small Height
export const SmallHeight: Story = {
  render: () => (
    <InteractiveSQLEditor
      height="200px"
      tables={sampleTables}
      value="SELECT * FROM users WHERE active = true;"
    />
  ),
};

// Story 6: Large Height
export const LargeHeight: Story = {
  render: () => (
    <InteractiveSQLEditor
      height="600px"
      tables={sampleTables}
      value={`-- Large editor for complex queries
SELECT
  users.id,
  users.name,
  users.email,
  users.age,
  users.created_at,
  COUNT(orders.order_id) as total_orders,
  SUM(orders.total_amount) as lifetime_value,
  AVG(orders.total_amount) as avg_order_value,
  MAX(orders.created_at) as last_order_date
FROM users
LEFT JOIN orders ON users.id = orders.user_id
WHERE users.active = true
GROUP BY
  users.id,
  users.name,
  users.email,
  users.age,
  users.created_at
HAVING COUNT(orders.order_id) > 5
ORDER BY lifetime_value DESC
LIMIT 100;`}
    />
  ),
};

// Story 7: Empty Editor
export const Empty: Story = {
  render: () => (
    <InteractiveSQLEditor height="300px" tables={sampleTables} value="" />
  ),
};

// Story 8: Warehouse Schema Example
export const WarehouseExample: Story = {
  render: () => {
    const warehouseTables: SQLTableSchema[] = [
      {
        name: 'website_events',
        columns: [
          { name: 'id', type: 'VARCHAR(36)', description: 'Event ID' },
          {
            name: 'workspace_id',
            type: 'VARCHAR(36)',
            description: 'Workspace ID',
          },
          {
            name: 'website_id',
            type: 'VARCHAR(36)',
            description: 'Website ID',
          },
          {
            name: 'session_id',
            type: 'VARCHAR(36)',
            description: 'Session ID',
          },
          { name: 'url', type: 'VARCHAR(512)', description: 'Page URL' },
          {
            name: 'referrer',
            type: 'VARCHAR(512)',
            description: 'Referrer URL',
          },
          { name: 'browser', type: 'VARCHAR(50)', description: 'Browser name' },
          { name: 'os', type: 'VARCHAR(50)', description: 'Operating system' },
          { name: 'device', type: 'VARCHAR(50)', description: 'Device type' },
          { name: 'country', type: 'VARCHAR(2)', description: 'Country code' },
          { name: 'date', type: 'DATE', description: 'Event date' },
          {
            name: 'created_at',
            type: 'TIMESTAMP',
            description: 'Event timestamp',
          },
        ],
      },
      {
        name: 'monitor_events',
        columns: [
          { name: 'id', type: 'VARCHAR(36)', description: 'Event ID' },
          {
            name: 'workspace_id',
            type: 'VARCHAR(36)',
            description: 'Workspace ID',
          },
          {
            name: 'monitor_id',
            type: 'VARCHAR(36)',
            description: 'Monitor ID',
          },
          {
            name: 'status_code',
            type: 'INTEGER',
            description: 'HTTP status code',
          },
          {
            name: 'response_time',
            type: 'INTEGER',
            description: 'Response time in ms',
          },
          { name: 'date', type: 'DATE', description: 'Event date' },
          {
            name: 'created_at',
            type: 'TIMESTAMP',
            description: 'Event timestamp',
          },
        ],
      },
    ];

    return (
      <InteractiveSQLEditor
        height="500px"
        tables={warehouseTables}
        value={`-- Tianji Warehouse Query Example
-- Analyze website traffic by country
SELECT
  country,
  DATE(created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT website_id) as unique_websites
FROM website_events
WHERE date >= '2024-01-01'
  AND date <= '2024-12-31'
GROUP BY country, DATE(created_at)
ORDER BY total_events DESC
LIMIT 100;`}
      />
    );
  },
};

// Story 9: Single Table
export const SingleTable: Story = {
  render: () => (
    <InteractiveSQLEditor
      height="350px"
      tables={[sampleTables[0]]}
      value={`-- Query with single table
SELECT
  id,
  name,
  email,
  age
FROM users
WHERE age >= 18
  AND active = true
ORDER BY created_at DESC;`}
    />
  ),
};

// Story 10: No Tables
export const NoTables: Story = {
  render: () => (
    <InteractiveSQLEditor
      height="300px"
      value={`-- Editor without table schema
-- Only SQL keywords and functions will be suggested
SELECT COUNT(*) FROM my_table;`}
    />
  ),
};

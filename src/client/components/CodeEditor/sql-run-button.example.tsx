import React, { useState } from 'react';
import { SQLEditor, SQLTableSchema } from './index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Example: SQL Editor with Run Button
 * Demonstrates the statement-by-statement execution feature
 */
export const SQLEditorWithRunButton: React.FC = () => {
  const [sql, setSql] =
    useState(`-- Click the ▶ Run button to execute each SQL statement
-- Statements are separated by semicolons

SELECT * FROM users WHERE active = true;

SELECT COUNT(*) FROM orders;

SELECT
  users.name,
  COUNT(orders.order_id) as order_count
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.name;

-- Statement without trailing semicolon will also work
SELECT * FROM products`);

  const [lastExecuted, setLastExecuted] = useState<{
    line: number;
    sql: string;
  } | null>(null);

  const tables: SQLTableSchema[] = [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'INTEGER', description: 'Primary key' },
        { name: 'name', type: 'VARCHAR(255)', description: 'User name' },
        { name: 'email', type: 'VARCHAR(255)', description: 'User email' },
        { name: 'active', type: 'BOOLEAN', description: 'User status' },
      ],
    },
    {
      name: 'orders',
      columns: [
        { name: 'order_id', type: 'INTEGER', description: 'Primary key' },
        { name: 'user_id', type: 'INTEGER', description: 'User ID' },
        { name: 'total', type: 'DECIMAL(10,2)', description: 'Order total' },
      ],
    },
  ];

  const handleExecuteLine = (lineNumber: number, sqlStatement: string) => {
    console.log(`Executing line ${lineNumber}:`, sqlStatement);
    setLastExecuted({ line: lineNumber, sql: sqlStatement });

    // Here you would actually execute the SQL
    // e.g., trpc.warehouse.execute.mutate({ sql: sqlStatement })
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SQL Editor with Run Button</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Click the <strong>▶ Run</strong> button that appears at the start
            of each SQL statement. Statements are separated by semicolons (;).
            Multi-line statements are supported.
          </AlertDescription>
        </Alert>

        <SQLEditor
          height="400px"
          value={sql}
          onChange={setSql}
          tables={tables}
          enableRunButton={true}
          onExecuteLine={handleExecuteLine}
        />

        {lastExecuted && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <div>
                  <strong>Last Executed:</strong> Line {lastExecuted.line}
                </div>
                <div className="font-mono text-sm">{lastExecuted.sql}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-muted-foreground text-sm">
          <p className="font-medium">Features:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              Click <strong>▶ Run</strong> button to execute complete SQL
              statements
            </li>
            <li>Statements are separated by semicolons (;)</li>
            <li>Multi-line statements are fully supported</li>
            <li>Empty lines and comments are automatically skipped</li>
            <li>Hover over the button to see which lines will be executed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Example: SQL Editor without Run Button (default)
 */
export const StandardSQLEditor: React.FC = () => {
  const [sql, setSql] = useState('SELECT * FROM users;');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard SQL Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 text-sm">
          Without enableRunButton, the editor works as before with no run
          buttons.
        </p>
        <SQLEditor height="300px" value={sql} onChange={setSql} />
      </CardContent>
    </Card>
  );
};

/**
 * Example: Warehouse Query Builder with Run Button
 */
export const WarehouseQueryWithRun: React.FC = () => {
  const [query, setQuery] = useState(`-- Analyze website traffic
SELECT date, COUNT(*) as visits
FROM website_events
WHERE date >= '2024-01-01'
GROUP BY date
ORDER BY date DESC;`);

  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const tables: SQLTableSchema[] = [
    {
      name: 'website_events',
      columns: [
        { name: 'id', type: 'VARCHAR(36)' },
        { name: 'website_id', type: 'VARCHAR(36)' },
        { name: 'url', type: 'VARCHAR(512)' },
        { name: 'date', type: 'DATE' },
        { name: 'created_at', type: 'TIMESTAMP' },
      ],
    },
  ];

  const handleExecuteLine = async (lineNumber: number, sql: string) => {
    setExecuting(true);
    setResult(null);

    try {
      // Simulate API call
      console.log(`Executing SQL from line ${lineNumber}:`, sql);

      // Mock result
      setTimeout(() => {
        setResult({
          lineNumber,
          sql,
          rows: 42,
          executionTime: '0.15s',
        });
        setExecuting(false);
      }, 500);

      // Real implementation would be:
      // const result = await trpc.warehouse.execute.mutate({ sql });
      // setResult(result);
    } catch (error) {
      console.error('Execution failed:', error);
      setExecuting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Query Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SQLEditor
          height="300px"
          value={query}
          onChange={setQuery}
          tables={tables}
          enableRunButton={true}
          onExecuteLine={handleExecuteLine}
        />

        {executing && (
          <Alert>
            <AlertDescription>Executing query...</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <div>
                  <strong>Query executed successfully!</strong>
                </div>
                <div className="text-sm">Line: {result.lineNumber}</div>
                <div className="text-sm">Rows returned: {result.rows}</div>
                <div className="text-sm">
                  Execution time: {result.executionTime}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

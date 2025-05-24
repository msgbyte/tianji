import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CodeBlock } from './CodeBlock';

interface CodeExampleItem {
  label: string;
  code?: string;
  element?: React.ReactNode;
}
interface CodeExampleProps {
  className?: string;
  example: Record<string, CodeExampleItem>;
}
export const CodeExample: React.FC<CodeExampleProps> = React.memo((props) => {
  const keys = Object.keys(props.example);

  return (
    <Tabs className={props.className} defaultValue={keys[0]}>
      <TabsList className="max-w-full justify-normal overflow-x-auto overflow-y-hidden">
        {keys.map((key) => (
          <TabsTrigger key={key} value={key}>
            {props.example[key].label}
          </TabsTrigger>
        ))}
      </TabsList>

      {keys.map((key) => (
        <TabsContent key={key} value={key}>
          {props.example[key].element ?? (
            <CodeBlock code={props.example[key].code ?? ''} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
});
CodeExample.displayName = 'CodeExample';

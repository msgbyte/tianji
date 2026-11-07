import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function App() {
  const [value, setValue] = useState(0);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Tianji Artifact</h1>
      <p className="text-muted-foreground">
        Build an interactive report, visualization, or prototype here.
      </p>
      <Button onClick={() => setValue((current) => current + 1)}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Clicks: {value}
      </Button>
    </main>
  );
}

import { Layout } from '@/components/layout';
import { InsightsStoreProvider } from '@/store/insights';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/insights')({
  beforeLoad: routeAuthBeforeLoad,
  validateSearch: z.object({
    query: z.any().optional(),
  }),
  component: PageComponent,
});

function PageComponent() {
  return (
    <InsightsStoreProvider>
      <Layout />
    </InsightsStoreProvider>
  );
}

import { Layout } from '@/components/layout';
import { InsightsStoreProvider } from '@/store/insights';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/insights')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  return (
    <InsightsStoreProvider>
      <Layout />
    </InsightsStoreProvider>
  );
}

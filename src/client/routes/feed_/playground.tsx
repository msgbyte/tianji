import { createFileRoute } from '@tanstack/react-router';
import { routeAuthBeforeLoad } from '@/utils/route';
import { WebhookPlayground } from '@/components/WebhookPlayground';

export const Route = createFileRoute('/feed/playground')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  return <WebhookPlayground />;
}

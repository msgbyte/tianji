import { createFileRoute } from '@tanstack/react-router';
import { AIGatewayObserver } from '@/components/aiGateway/AIGatewayObserver';
import { routeAuthBeforeLoad } from '@/utils/route';

export const Route = createFileRoute('/aiGateway/$gatewayId/observer')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { gatewayId } = Route.useParams<{ gatewayId: string }>();

  return <AIGatewayObserver key={gatewayId} gatewayId={gatewayId} />;
}

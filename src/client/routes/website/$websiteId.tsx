import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';

export const Route = createFileRoute('/website/$websiteId')({
  beforeLoad: routeAuthBeforeLoad,
  component: WebsiteDetailComponent,
});

function WebsiteDetailComponent() {
  const params = Route.useParams<{ websiteId: string }>();

  return <div>website: {params.websiteId}</div>;
}

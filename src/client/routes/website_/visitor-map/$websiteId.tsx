import { createFileRoute } from '@tanstack/react-router';
import { routeAuthBeforeLoad } from '@/utils/route';
import { WebsiteVisitorMap } from '@/components/website/WebsiteVisitorMap';
import { ErrorTip } from '@/components/ErrorTip';

export const Route = createFileRoute('/website/visitor-map/$websiteId')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { websiteId } = Route.useParams<{ websiteId: string }>();

  if (!websiteId) {
    return <ErrorTip />;
  }

  return <WebsiteVisitorMap websiteId={websiteId} fullScreen={true} />;
}

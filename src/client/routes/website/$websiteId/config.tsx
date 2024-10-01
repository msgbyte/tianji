import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WebsiteConfig } from '@/components/website/WebsiteConfig';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/website/$websiteId/config')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { websiteId } = Route.useParams<{ websiteId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { data: website, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId,
  });
  const { t } = useTranslation();

  if (!websiteId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!website) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={<CommonHeader title={website.name} desc={t('Config')} />}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <WebsiteConfig websiteId={websiteId} />
      </ScrollArea>
    </CommonWrapper>
  );
}

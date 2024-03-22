import { trpc } from '@/api/trpc';
import { CommonList } from '@/components/CommonList';
import { Separator } from '@/components/ui/separator';
import { AddWebsiteBtn } from '@/components/website/AddWebsiteBtn';
import { useDataReady } from '@/hooks/useDataReady';
import { LayoutV2 } from '@/pages/LayoutV2';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from '@tanstack/react-router';

const routeApi = getRouteApi('/website/$websiteId');

export const Route = createFileRoute('/website')({
  beforeLoad: routeAuthBeforeLoad,
  component: WebsiteComponent,
});

function WebsiteComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data = [] } = trpc.website.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();

  const items = data.map((item) => ({
    id: item.id,
    title: item.name,
    content: item.domain,
    tags: [],
    href: `/website/${item.id}`,
  }));
  const params = routeApi.useParams<{ websiteId: string }>();

  useDataReady(
    () => data.length > 0,
    () => {
      if (!params.websiteId && data[0]) {
        navigate({
          to: '/website/$websiteId',
          params: {
            websiteId: data[0].id,
          },
        });
      }
    }
  );

  return (
    <LayoutV2
      list={
        <div>
          <div className="flex items-center px-4 py-2">
            <h1 className="text-xl font-bold">{t('Website')}</h1>

            <div className="ml-auto">
              <AddWebsiteBtn />
            </div>
          </div>
          <Separator />

          <CommonList hasSearch={true} items={items} />
        </div>
      }
    />
  );
}

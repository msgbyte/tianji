import { routeAuthBeforeLoad } from '@/utils/route';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { WebsiteOverview } from '@/components/website/WebsiteOverview';
import { Empty } from 'antd';
import { LuArrowRight, LuPlus } from 'react-icons/lu';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createFileRoute('/website/overview')({
  beforeLoad: routeAuthBeforeLoad,
  component: WebsiteOverviewComponent,
});

function WebsiteOverviewComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { data: websites = [], isLoading } = trpc.website.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Website Overview')}</h1>}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        {websites.length === 0 && isLoading === false && (
          <Empty
            className="pt-8"
            description={
              <div className="py-2">
                <div className="mb-1">
                  {t('Not any website has been exist')}
                </div>
                <Button
                  Icon={LuPlus}
                  onClick={() =>
                    navigate({
                      to: '/website/add',
                    })
                  }
                >
                  {t('Add Website Now')}
                </Button>
              </div>
            }
          />
        )}

        <div className="space-y-10 p-4">
          {websites.map((website) => (
            <WebsiteOverview
              key={website.id}
              website={website}
              actions={
                <Link
                  to="/website/$websiteId"
                  params={{ websiteId: website.id }}
                >
                  <Button size="lg">
                    {t('View Details')} <LuArrowRight className="ml-2" />
                  </Button>
                </Link>
              }
            />
          ))}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}

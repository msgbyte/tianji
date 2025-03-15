import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Empty } from 'antd';
import { LuPlus } from 'react-icons/lu';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createFileRoute('/application/overview')({
  beforeLoad: routeAuthBeforeLoad,
  component: ApplicationOverviewComponent,
});

function ApplicationOverviewComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { data: applications = [], isLoading } = trpc.application.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();

  return (
    <CommonWrapper
      header={
        <h1 className="text-xl font-bold">{t('Application Overview')}</h1>
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        {applications.length === 0 && isLoading === false && (
          <Empty
            className="pt-8"
            description={
              <div className="py-2">
                <div className="mb-1">
                  {t('Not any application has been exist')}
                </div>
                <Button
                  Icon={LuPlus}
                  onClick={() =>
                    navigate({
                      to: '/application/add',
                    })
                  }
                >
                  {t('Add Application Now')}
                </Button>
              </div>
            }
          />
        )}

        {/* TODO */}
        {/* <div className="space-y-10 p-4">
          {applications.map((application) => (
            <WebsiteOverview
              key={application.id}
              website={application}
              actions={
                <Link
                  to="/application/$applicationId"
                  params={{ applicationId: application.id }}
                >
                  <Button size="lg">
                    {t('View Details')} <LuArrowRight className="ml-2" />
                  </Button>
                </Link>
              }
            />
          ))}
        </div> */}
      </ScrollArea>
    </CommonWrapper>
  );
}

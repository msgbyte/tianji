import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LuPencil } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { ApplicationOverviewCard } from '@/components/application/ApplicationOverviewCard';
import { ApplicationDetailCard } from '@/components/application/ApplicationDetailCard';
import { ApplicationStatsChart } from '@/components/application/ApplicationStatsChart';

export const Route = createFileRoute('/application/$applicationId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { applicationId } = Route.useParams<{ applicationId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { data: application, isLoading } = trpc.application.info.useQuery({
    workspaceId,
    applicationId,
  });
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();
  const { t } = useTranslation();

  if (!applicationId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!application) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={application.name}
          actions={
            <div className="space-x-2">
              {hasAdminPermission && (
                <Button
                  size="icon"
                  variant="outline"
                  Icon={LuPencil}
                  onClick={() =>
                    navigate({
                      to: '/application/$applicationId/edit',
                      params: {
                        applicationId,
                      },
                    })
                  }
                />
              )}
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <ScrollBar orientation="horizontal" />

        {/* Use Tabs component to categorize data from different stores */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
            {application.applicationStoreInfos.some(
              (info) => info.storeType === 'appstore'
            ) && <TabsTrigger value="appstore">App Store</TabsTrigger>}
            {application.applicationStoreInfos.some(
              (info) => info.storeType === 'googleplay'
            ) && <TabsTrigger value="googleplay">Google Play</TabsTrigger>}
          </TabsList>

          {/* Overview tab content */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {application.applicationStoreInfos.map((storeInfo) => (
                <ApplicationOverviewCard
                  key={storeInfo.storeType}
                  storeInfo={storeInfo}
                />
              ))}
            </div>

            {application.applicationStoreInfos.length > 0 ? (
              <div className="mt-4">
                <ApplicationStatsChart applicationId={applicationId} />
              </div>
            ) : (
              <div>
                <div className="text-muted-foreground text-sm">
                  {t(
                    'No app store information found, please bind application store info first'
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* App Store tab content */}
          {application.applicationStoreInfos.some(
            (info) => info.storeType === 'appstore'
          ) && (
            <TabsContent value="appstore" className="mt-4">
              {(() => {
                const appStoreInfo = application.applicationStoreInfos.find(
                  (info) => info.storeType === 'appstore'
                );

                if (!appStoreInfo) {
                  return null;
                }

                return <ApplicationDetailCard storeInfo={appStoreInfo} />;
              })()}
            </TabsContent>
          )}

          {/* Google Play tab content */}
          {application.applicationStoreInfos.some(
            (info) => info.storeType === 'googleplay'
          ) && (
            <TabsContent value="googleplay" className="mt-4">
              {(() => {
                const playStoreInfo = application.applicationStoreInfos.find(
                  (info) => info.storeType === 'googleplay'
                );

                if (!playStoreInfo) {
                  return null;
                }

                return <ApplicationDetailCard storeInfo={playStoreInfo} />;
              })()}
            </TabsContent>
          )}
        </Tabs>
      </ScrollArea>
    </CommonWrapper>
  );
}

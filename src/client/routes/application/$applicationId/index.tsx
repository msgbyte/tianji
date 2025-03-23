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
import { LuPencil, LuTrash } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { ApplicationOverviewCard } from '@/components/application/ApplicationOverviewCard';
import { ApplicationDetailCard } from '@/components/application/ApplicationDetailCard';
import { ApplicationStatsChart } from '@/components/application/ApplicationStatsChart';
import { AlertConfirm } from '@/components/AlertConfirm';
import { message } from 'antd';
import { ApplicationCompareTab } from '@/components/application/ApplicationCompareTab';

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
  const trpcUtils = trpc.useUtils();

  const deleteMutation = trpc.application.delete.useMutation({
    onError: (error) => {
      message.error(error.message);
    },
  });

  const handleDeleteApplication = async () => {
    await deleteMutation.mutateAsync({ workspaceId, applicationId });

    message.success(t('Delete Success'));

    await trpcUtils.application.all.refetch({ workspaceId });

    navigate({
      to: '/application',
    });
  };

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
                <>
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
                  <AlertConfirm
                    title={t('Delete Application') + ' ' + application.name}
                    description={t(
                      'Are you sure you want to delete this application? This action cannot be undone.'
                    )}
                    onConfirm={handleDeleteApplication}
                  >
                    <Button size="icon" variant="outline" Icon={LuTrash} />
                  </AlertConfirm>
                </>
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
          <TabsContent value="overview" className="mt-4 flex flex-col gap-4">
            <div>
              <ApplicationStatsChart applicationId={applicationId} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {application.applicationStoreInfos.map((storeInfo) => (
                <ApplicationOverviewCard
                  key={storeInfo.storeType}
                  storeInfo={storeInfo}
                />
              ))}
            </div>
          </TabsContent>

          {/* App Store tab content */}
          {application.applicationStoreInfos.some(
            (info) => info.storeType === 'appstore'
          ) && (
            <TabsContent value="appstore" className="mt-4 space-y-4">
              {(() => {
                const appStoreInfo = application.applicationStoreInfos.find(
                  (info) => info.storeType === 'appstore'
                );

                if (!appStoreInfo) {
                  return null;
                }

                return <ApplicationDetailCard storeInfo={appStoreInfo} />;
              })()}

              <ApplicationCompareTab
                storeType="appstore"
                applications={[
                  {
                    applicationId: application.id,
                    applicationName: application.name,
                  },
                ]}
              />
            </TabsContent>
          )}

          {/* Google Play tab content */}
          {application.applicationStoreInfos.some(
            (info) => info.storeType === 'googleplay'
          ) && (
            <TabsContent value="googleplay" className="mt-4 space-y-4">
              {(() => {
                const playStoreInfo = application.applicationStoreInfos.find(
                  (info) => info.storeType === 'googleplay'
                );

                if (!playStoreInfo) {
                  return null;
                }

                return <ApplicationDetailCard storeInfo={playStoreInfo} />;
              })()}

              <ApplicationCompareTab
                storeType="googleplay"
                applications={[
                  {
                    applicationId: application.id,
                    applicationName: application.name,
                  },
                ]}
              />
            </TabsContent>
          )}
        </Tabs>
      </ScrollArea>
    </CommonWrapper>
  );
}

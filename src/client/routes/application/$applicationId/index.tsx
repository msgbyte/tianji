import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LuPencil } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { ReadMore } from '@/components/ReadMore';

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
                <Card key={storeInfo.storeType} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {storeInfo.storeType === 'appstore'
                        ? 'App Store'
                        : 'Google Play'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">{t('App Name')}:</span>{' '}
                        {storeInfo.title}
                      </div>
                      <div>
                        <span className="font-medium">{t('Version')}:</span>{' '}
                        {storeInfo.version || t('Unknown')}
                      </div>
                      <div>
                        <span className="font-medium">{t('Rating')}:</span>{' '}
                        {storeInfo.score?.toFixed(1) || t('Unknown')}
                      </div>
                      <div>
                        <span className="font-medium">
                          {t('Rating Count')}:
                        </span>{' '}
                        {storeInfo.ratingCount?.toLocaleString() ||
                          t('Unknown')}
                      </div>
                      {storeInfo.downloads && (
                        <div>
                          <span className="font-medium">{t('Downloads')}:</span>{' '}
                          {storeInfo.downloads.toLocaleString()}
                        </div>
                      )}

                      {storeInfo.size && (
                        <div>
                          <span className="font-medium">{t('Size')}:</span>{' '}
                          {storeInfo.size
                            ? `${(storeInfo.size / 1024 / 1024).toFixed(2)} MB`
                            : t('Unknown')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

                if (!appStoreInfo) return null;

                return (
                  <Card>
                    <CardHeader>
                      <CardTitle>{appStoreInfo.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-lg font-medium">
                          {t('App Description')}
                        </h3>

                        <ReadMore className="text-muted-foreground whitespace-pre-line text-sm">
                          <p>{appStoreInfo.description}</p>
                        </ReadMore>
                      </div>

                      <div>
                        <h3 className="mb-2 text-lg font-medium">
                          {t('Release Notes')}
                        </h3>
                        <p className="text-muted-foreground whitespace-pre-line text-sm">
                          {appStoreInfo.releaseNotes || t('No release notes')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="mb-2 text-lg font-medium">
                            {t('Basic Information')}
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">
                                {t('Version')}:
                              </span>{' '}
                              {appStoreInfo.version || t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">{t('Size')}:</span>{' '}
                              {appStoreInfo.size
                                ? `${(appStoreInfo.size / 1024 / 1024).toFixed(2)} MB`
                                : t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">App ID:</span>{' '}
                              {appStoreInfo.appId}
                            </div>
                            <div>
                              <span className="font-medium">Store ID:</span>{' '}
                              {appStoreInfo.storeId}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-2 text-lg font-medium">
                            {t('Rating Information')}
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">
                                {t('Rating')}:
                              </span>{' '}
                              {appStoreInfo.score?.toFixed(1) || t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">
                                {t('Rating Count')}:
                              </span>{' '}
                              {appStoreInfo.ratingCount?.toLocaleString() ||
                                t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">
                                {t('Review Count')}:
                              </span>{' '}
                              {appStoreInfo.reviews?.toLocaleString() ||
                                t('Unknown')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Button variant="outline" asChild>
                          <a
                            href={appStoreInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('View in App Store')}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
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

                if (!playStoreInfo) return null;

                return (
                  <Card>
                    <CardHeader>
                      <CardTitle>{playStoreInfo.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-lg font-medium">
                          {t('App Description')}
                        </h3>
                        <ReadMore className="text-muted-foreground whitespace-pre-line text-sm">
                          <p>{playStoreInfo.description}</p>
                        </ReadMore>
                      </div>

                      <div>
                        <h3 className="mb-2 text-lg font-medium">
                          {t('Release Notes')}
                        </h3>
                        <p className="text-muted-foreground whitespace-pre-line text-sm">
                          {playStoreInfo.releaseNotes || t('No release notes')}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="mb-2 text-lg font-medium">
                            {t('Basic Information')}
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">
                                {t('Version')}:
                              </span>{' '}
                              {playStoreInfo.version || t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">{t('Size')}:</span>{' '}
                              {playStoreInfo.size
                                ? `${(playStoreInfo.size / 1024 / 1024).toFixed(2)} MB`
                                : t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">App ID:</span>{' '}
                              {playStoreInfo.appId}
                            </div>
                            <div>
                              <span className="font-medium">Store ID:</span>{' '}
                              {playStoreInfo.storeId}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-2 text-lg font-medium">
                            {t('Downloads & Ratings')}
                          </h3>
                          <div className="space-y-2">
                            {playStoreInfo.downloads && (
                              <div>
                                <span className="font-medium">
                                  {t('Downloads')}:
                                </span>{' '}
                                {playStoreInfo.downloads?.toLocaleString() ||
                                  t('Unknown')}
                              </div>
                            )}

                            <div>
                              <span className="font-medium">
                                {t('Rating')}:
                              </span>{' '}
                              {playStoreInfo.score?.toFixed(1) || t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">
                                {t('Rating Count')}:
                              </span>{' '}
                              {playStoreInfo.ratingCount?.toLocaleString() ||
                                t('Unknown')}
                            </div>
                            <div>
                              <span className="font-medium">
                                {t('Review Count')}:
                              </span>{' '}
                              {playStoreInfo.reviews?.toLocaleString() ||
                                t('Unknown')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Button variant="outline" asChild>
                          <a
                            href={playStoreInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('View in Google Play')}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </TabsContent>
          )}
        </Tabs>
      </ScrollArea>
    </CommonWrapper>
  );
}

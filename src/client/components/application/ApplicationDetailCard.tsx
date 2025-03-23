import { AppRouterOutput } from '@/api/trpc';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useTranslation } from '@i18next-toolkit/react';
import { ReadMore } from '../ReadMore';
import { Button } from '../ui/button';
import { LuArrowUpRight } from 'react-icons/lu';

interface ApplicationDetailCardProps {
  storeInfo: NonNullable<
    AppRouterOutput['application']['info']
  >['applicationStoreInfos'][number];
}
export const ApplicationDetailCard: React.FC<ApplicationDetailCardProps> =
  React.memo((props) => {
    const { storeInfo } = props;
    const { t } = useTranslation();

    if (storeInfo.storeType === 'appstore') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{storeInfo.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">
                {t('App Description')}
              </h3>

              <ReadMore className="text-muted-foreground whitespace-pre-line text-sm">
                <p>{storeInfo.description}</p>
              </ReadMore>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium">{t('Release Notes')}</h3>
              <p className="text-muted-foreground whitespace-pre-line text-sm">
                {storeInfo.releaseNotes || t('No release notes')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-2 text-lg font-medium">
                  {t('Basic Information')}
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{t('Version')}:</span>{' '}
                    {storeInfo.version || t('Unknown')}
                  </div>
                  <div>
                    <span className="font-medium">{t('Size')}:</span>{' '}
                    {storeInfo.size
                      ? `${(storeInfo.size / 1024 / 1024).toFixed(2)} MB`
                      : t('Unknown')}
                  </div>
                  <div>
                    <span className="font-medium">App ID:</span>{' '}
                    {storeInfo.appId}
                  </div>
                  <div>
                    <span className="font-medium">Store ID:</span>{' '}
                    {storeInfo.storeId}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  {t('Rating Information')}
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{t('Rating')}:</span>{' '}
                    {storeInfo.score?.toFixed(1) || t('Unknown')}
                  </div>
                  <div>
                    <span className="font-medium">{t('Rating Count')}:</span>{' '}
                    {storeInfo.ratingCount?.toLocaleString() || t('Unknown')}
                  </div>
                  <div>
                    <span className="font-medium">{t('Review Count')}:</span>{' '}
                    {storeInfo.reviews?.toLocaleString() || t('Unknown')}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <a href={storeInfo.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  {t('View in App Store')} <LuArrowUpRight size={18} />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (storeInfo.storeType === 'googleplay') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{storeInfo.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">
                {t('App Description')}
              </h3>
              <ReadMore className="text-muted-foreground whitespace-pre-line text-sm">
                <p>{storeInfo.description}</p>
              </ReadMore>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium">{t('Release Notes')}</h3>
              <p className="text-muted-foreground whitespace-pre-line text-sm">
                {storeInfo.releaseNotes || t('No release notes')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="mb-2 text-lg font-medium">
                  {t('Basic Information')}
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{t('Version')}:</span>{' '}
                    {storeInfo.version || t('Unknown')}
                  </div>

                  {storeInfo.downloads && (
                    <div>
                      <span className="font-medium">{t('Downloads')}:</span>{' '}
                      {storeInfo.downloads?.toLocaleString() || t('Unknown')}
                    </div>
                  )}

                  <div>
                    <span className="font-medium">App ID:</span>{' '}
                    {storeInfo.appId}
                  </div>

                  <div>
                    <span className="font-medium">Store ID:</span>{' '}
                    {storeInfo.storeId}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">
                  {t('Rating Information')}
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{t('Rating')}:</span>{' '}
                    {storeInfo.score?.toFixed(1) || t('Unknown')}
                  </div>
                  <div>
                    <span className="font-medium">{t('Rating Count')}:</span>{' '}
                    {storeInfo.ratingCount?.toLocaleString() || t('Unknown')}
                  </div>
                  <div>
                    <span className="font-medium">{t('Review Count')}:</span>{' '}
                    {storeInfo.reviews?.toLocaleString() || t('Unknown')}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <a href={storeInfo.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  {t('View in Google Play')} <LuArrowUpRight size={18} />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  });
ApplicationDetailCard.displayName = 'ApplicationDetailCard';

import { AppRouterOutput } from '@/api/trpc';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useTranslation } from '@i18next-toolkit/react';

interface ApplicationOverviewCardProps {
  storeInfo: NonNullable<
    AppRouterOutput['application']['info']
  >['applicationStoreInfos'][number];
}
export const ApplicationOverviewCard: React.FC<ApplicationOverviewCardProps> =
  React.memo((props) => {
    const { storeInfo } = props;
    const { t } = useTranslation();

    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center">
            {storeInfo.storeType === 'appstore' ? 'App Store' : 'Google Play'}
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
              <span className="font-medium">{t('Rating Count')}:</span>{' '}
              {storeInfo.ratingCount?.toLocaleString() || t('Unknown')}
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
    );
  });
ApplicationOverviewCard.displayName = 'ApplicationOverviewCard';

import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTranslation } from '@i18next-toolkit/react';
import { ApplicationCompareChart } from './ApplicationCompareChart';

interface ApplicationCompareTabProps {
  storeType: 'appstore' | 'googleplay';
  applications: {
    applicationId: string;
    applicationName: string;
  }[];
}
export const ApplicationCompareTab: React.FC<ApplicationCompareTabProps> =
  React.memo((props) => {
    const { storeType } = props;
    const { t } = useTranslation();

    const applications = useMemo(
      () =>
        props.applications.map((application) => ({
          applicationId: application.applicationId,
          applicationName: application.applicationName,
          storeType: storeType,
        })),
      [storeType, props.applications]
    );

    return (
      <Tabs defaultValue="score">
        <TabsList>
          <TabsTrigger value="score">{t('Score')}</TabsTrigger>
          <TabsTrigger value="ratingCount">{t('Rating Count')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('Reviews')}</TabsTrigger>

          {storeType === 'googleplay' && (
            <TabsTrigger value="downloads">{t('Downloads')}</TabsTrigger>
          )}

          {storeType === 'appstore' && (
            <TabsTrigger value="size">{t('Size')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="score">
          <ApplicationCompareChart applications={applications} field="score" />
        </TabsContent>
        <TabsContent value="ratingCount">
          <ApplicationCompareChart
            applications={applications}
            field="ratingCount"
          />
        </TabsContent>
        <TabsContent value="reviews">
          <ApplicationCompareChart
            applications={applications}
            field="reviews"
          />
        </TabsContent>
        <TabsContent value="downloads">
          <ApplicationCompareChart
            applications={applications}
            field="downloads"
          />
        </TabsContent>
        <TabsContent value="size">
          <ApplicationCompareChart applications={applications} field="size" />
        </TabsContent>
      </Tabs>
    );
  });
ApplicationCompareTab.displayName = 'ApplicationCompareTab';

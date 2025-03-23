import { trpc } from '@/api/trpc';
import { ApplicationCompareTab } from '@/components/application/ApplicationCompareTab';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';
import { Select as AntdSelect } from 'antd';
import { useMemo } from 'react';
import { useState } from 'react';

export const Route = createFileRoute('/application/compare')({
  beforeLoad: routeAuthBeforeLoad,
  component: ApplicationCompare,
});

function ApplicationCompare() {
  const workspaceId = useCurrentWorkspaceId();
  const { data: allApplications = [], isLoading } =
    trpc.application.all.useQuery({
      workspaceId,
    });
  const { t } = useTranslation();

  const [selectedStore, setSelectedStore] = useState<'appstore' | 'googleplay'>(
    'appstore'
  );
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<
    string[]
  >([]);

  const options = allApplications.map((application) => ({
    value: application.id,
    label: application.name,
  }));

  const selectedAppplicationInfo = useMemo(() => {
    return allApplications.filter((app) =>
      selectedApplicationIds.includes(app.id)
    );
  }, [selectedApplicationIds]);

  const applications = selectedAppplicationInfo.map((info) => ({
    applicationId: info.id,
    applicationName: info.name,
  }));

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Application Compare')}</h1>}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="mb-4 flex gap-2">
          <Select
            value={selectedStore}
            onValueChange={(val) =>
              setSelectedStore(val as 'appstore' | 'googleplay')
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appstore">Appstore</SelectItem>
              <SelectItem value="googleplay">Google Play</SelectItem>
            </SelectContent>
          </Select>

          <AntdSelect
            className="w-[240px]"
            mode="multiple"
            allowClear
            placeholder={t('Please select applications')}
            loading={isLoading}
            value={selectedApplicationIds}
            onChange={setSelectedApplicationIds}
            options={options}
          />
        </div>

        <ApplicationCompareTab
          storeType={selectedStore}
          applications={applications}
        />
      </ScrollArea>
    </CommonWrapper>
  );
}

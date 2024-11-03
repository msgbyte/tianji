import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommonHeader } from '@/components/CommonHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AppRouterOutput, defaultErrorHandler, trpc } from '@/api/trpc';
import { createColumnHelper, DataTable } from '@/components/DataTable';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import dayjs from 'dayjs';
import { LuPlus, LuTrash } from 'react-icons/lu';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import { CopyableText } from '@/components/CopyableText';
import { AlertConfirm } from '@/components/AlertConfirm';
import { formatNumber } from '@/utils/common';

export const Route = createFileRoute('/settings/apiKey')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

type ApiKeyInfo = AppRouterOutput['user']['allApiKeys'][number];
const columnHelper = createColumnHelper<ApiKeyInfo>();

function PageComponent() {
  const { t } = useTranslation();
  const { data: apiKeys = [], refetch: refetchApiKeys } =
    trpc.user.allApiKeys.useQuery();
  const generateApiKeyMutation = trpc.user.generateApiKey.useMutation({
    onError: defaultErrorHandler,
  });
  const deleteApiKeyMutation = trpc.user.deleteApiKey.useMutation({
    onError: defaultErrorHandler,
  });

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('apiKey', {
        header: t('Key'),
        size: 300,
        cell: (props) => {
          return (
            <CopyableText text={props.getValue()}>
              {props.getValue().slice(0, 20)}...
            </CopyableText>
          );
        },
      }),
      columnHelper.accessor('usage', {
        header: t('Usage'),
        size: 80,
        cell: (props) => {
          return (
            <div className="text-right">
              {formatNumber(Number(props.getValue()))}
            </div>
          );
        },
      }),
      columnHelper.accessor('createdAt', {
        header: t('Created At'),
        size: 130,
        cell: (props) => {
          const date = props.getValue();
          return (
            <span>
              {date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </span>
          );
        },
      }),
      columnHelper.accessor('updatedAt', {
        header: t('Last Use At'),
        size: 130,
        cell: (props) => {
          const date = props.getValue();
          return (
            <span>
              {date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </span>
          );
        },
      }),
      columnHelper.accessor('expiredAt', {
        header: t('Expired At'),
        size: 130,
        cell: (props) => {
          const date = props.getValue();
          return (
            <span>
              {date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'action',
        header: t('Action'),
        size: 130,
        cell: (props) => {
          return (
            <div>
              <AlertConfirm
                onConfirm={async () => {
                  await deleteApiKeyMutation.mutateAsync({
                    apiKey: props.row.original.apiKey,
                  });
                  refetchApiKeys();
                }}
              >
                <Button variant="outline" size="icon" Icon={LuTrash} />
              </AlertConfirm>
            </div>
          );
        },
      }),
    ];
  }, [t]);

  const handleGenerateApiKey = useEvent(async () => {
    const apiKey = await generateApiKeyMutation.mutateAsync();

    copy(apiKey);
    toast.success(t('New api key has been copied into your clipboard!'));
    refetchApiKeys();
  });

  return (
    <CommonWrapper header={<CommonHeader title={t('Api Keys')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="text-lg font-bold">
              <div className="flex items-center justify-between gap-2">
                <div>{t('Api Keys')}</div>

                <Button
                  Icon={LuPlus}
                  size="icon"
                  variant="outline"
                  onClick={handleGenerateApiKey}
                />
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={apiKeys} />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}

import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommonHeader } from '@/components/CommonHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AppRouterOutput, defaultErrorHandler, trpc } from '@/api/trpc';
import { createColumnHelper, DataTable } from '@/components/DataTable';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import dayjs from 'dayjs';
import { LuPlus, LuPencil, LuTrash } from 'react-icons/lu';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import { CopyableText } from '@/components/CopyableText';
import { AlertConfirm } from '@/components/AlertConfirm';
import { formatNumber } from '@/utils/common';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { TipIcon } from '@/components/TipIcon';

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
  const updateApiKeyDescriptionMutation =
    trpc.user.updateApiKeyDescription.useMutation({
      onError: defaultErrorHandler,
    });

  const [editingApiKey, setEditingApiKey] = useState<ApiKeyInfo | null>(null);
  const [description, setDescription] = useState('');

  const handleSaveDescription = useEvent(async () => {
    if (!editingApiKey) return;

    await updateApiKeyDescriptionMutation.mutateAsync({
      apiKey: editingApiKey.apiKey,
      description: description || null,
    });

    setEditingApiKey(null);
    refetchApiKeys();
    toast.success(t('Description updated'));
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
      columnHelper.accessor('description', {
        header: t('Description'),
        size: 200,
        cell: (props) => {
          return props.getValue() || '-';
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                Icon={LuPencil}
                onClick={() => {
                  setEditingApiKey(props.row.original);
                  setDescription(props.row.original.description || '');
                }}
              />
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
    <>
      <CommonWrapper header={<CommonHeader title={t('Api Keys')} />}>
        <ScrollArea className="h-full overflow-hidden p-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="text-lg font-bold">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>{t('Api Keys')}</span>
                    <TipIcon
                      content={t(
                        'API keys are used to authenticate requests to the Tianji API. Click to check the usage of your API keys.'
                      )}
                      onClick={() => {
                        window.open(
                          'https://tianji.dev/docs/api/authentication',
                          '_blank'
                        );
                      }}
                    />
                  </div>

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

      <Dialog
        open={!!editingApiKey}
        onOpenChange={(open) => !open && setEditingApiKey(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit API Key Description')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button onClick={() => setEditingApiKey(null)} variant="outline">
              {t('Cancel')}
            </Button>
            <Button onClick={handleSaveDescription}>{t('Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

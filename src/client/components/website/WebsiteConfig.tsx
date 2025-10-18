import { Form, Input, message } from 'antd';
import React, { useMemo } from 'react';
import { useRequest } from '../../hooks/useRequest';
import { useCurrentWorkspaceId } from '../../store/user';
import { ErrorTip } from '../ErrorTip';
import { Loading } from '../Loading';
import { NoWorkspaceTip } from '../NoWorkspaceTip';
import { MonitorPickerOld } from '../monitor/MonitorPicker';
import {
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '../../api/trpc';
import { useEvent } from '../../hooks/useEvent';
import { hostnameValidator } from '../../utils/validator';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertConfirm } from '../AlertConfirm';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { toast } from 'sonner';
import copy from 'copy-to-clipboard';
import { LuShare2, LuTrash } from 'react-icons/lu';

export const WebsiteConfig: React.FC<{ websiteId: string }> = React.memo(
  (props) => {
    const { websiteId } = props;
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();
    const trpcUtils = trpc.useUtils();

    const { data: website, isLoading } = trpc.website.info.useQuery({
      workspaceId,
      websiteId,
    });

    const updateMutation = trpc.website.updateInfo.useMutation({
      onSuccess: defaultSuccessHandler,
      onError: defaultErrorHandler,
    });
    const deleteMutation = trpc.website.delete.useMutation({
      onError: defaultErrorHandler,
    });
    const enableShareMutation = trpc.website.createOrEnableShare.useMutation({
      onError: defaultErrorHandler,
    });
    const disableShareMutation = trpc.website.disableShare.useMutation({
      onError: defaultErrorHandler,
    });

    const handleSave = useEvent(
      async (values: { name: string; domain: string; monitorId: string }) => {
        await updateMutation.mutateAsync({
          workspaceId,
          websiteId,
          name: values.name,
          domain: values.domain,
          monitorId: values.monitorId ?? null,
        });

        trpcUtils.website.info.refetch({
          workspaceId,
          websiteId,
        });
        trpcUtils.website.all.refetch({ workspaceId });

        navigate({
          to: '/website/$websiteId',
          params: {
            websiteId,
          },
        });
      }
    );

    const [, handleDeleteWebsite] = useRequest(async () => {
      await deleteMutation.mutateAsync({ workspaceId, websiteId });

      message.success(t('Delete Success'));

      await trpcUtils.website.all.refetch({ workspaceId });

      navigate({
        to: '/website',
      });
    });

    const handleEnableShare = useEvent(async () => {
      const res = await enableShareMutation.mutateAsync({
        workspaceId,
        websiteId,
      });

      copy(res.shareUrl);
      toast.success(t('Public share link copied to clipboard'));

      await trpcUtils.website.info.refetch({ workspaceId, websiteId });
    });

    const handleDisableShare = useEvent(async () => {
      await disableShareMutation.mutateAsync({ workspaceId, websiteId });

      toast.success(t('Disable Public Share'));
      await trpcUtils.website.info.refetch({ workspaceId, websiteId });
    });

    const shareUrl = useMemo(() => {
      if (!website?.shareId) {
        return '';
      }

      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';

      if (origin) {
        return `${origin}/website/public/${website.shareId}`;
      }

      return `/website/public/${website.shareId}`;
    }, [website?.shareId]);

    if (!workspaceId) {
      return <NoWorkspaceTip />;
    }

    if (!websiteId) {
      return <ErrorTip />;
    }

    if (isLoading) {
      return <Loading />;
    }

    if (!website) {
      return <ErrorTip />;
    }

    return (
      <div>
        <div>
          <Tabs defaultValue="detail">
            <TabsList>
              <TabsTrigger value="detail">{t('Detail')}</TabsTrigger>
              <TabsTrigger value="data">{t('Data')}</TabsTrigger>
            </TabsList>
            <TabsContent value="detail">
              <Form
                layout="vertical"
                initialValues={{
                  id: website.id,
                  name: website.name,
                  domain: website.domain,
                  monitorId: website.monitorId,
                }}
                onFinish={handleSave}
              >
                <Form.Item label={t('Website ID')} name="id">
                  <Input size="large" disabled={true} />
                </Form.Item>
                <Form.Item
                  label={t('Name')}
                  name="name"
                  rules={[{ required: true }]}
                >
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  label={t('Domain')}
                  name="domain"
                  rules={[
                    { required: true },
                    {
                      validator: hostnameValidator,
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>

                <Form.Item
                  label={t('Monitor')}
                  name="monitorId"
                  tooltip={t(
                    'You can bind a monitor which will display health status in website overview'
                  )}
                >
                  <MonitorPickerOld size="large" allowClear={true} />
                </Form.Item>

                <Form.Item>
                  <Button type="submit">{t('Save')}</Button>
                </Form.Item>
              </Form>
            </TabsContent>
            <TabsContent value="data">
              <Card>
                <CardHeader className="text-lg font-bold">
                  {t('Public Share')}
                </CardHeader>
                <CardContent>
                  {website.shareId ? (
                    <div className="space-y-4">
                      <div className="break-all font-mono text-sm">
                        {shareUrl}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          Icon={LuShare2}
                          onClick={() => {
                            const origin =
                              typeof window !== 'undefined'
                                ? window.location.origin
                                : '';
                            const valueToCopy =
                              shareUrl.startsWith('http') || !origin
                                ? shareUrl
                                : `${origin}${shareUrl}`;

                            copy(valueToCopy);
                            toast.success(
                              t('Public share link copied to clipboard')
                            );
                          }}
                          aria-label={t(
                            'Public share link copied to clipboard'
                          )}
                        >
                          {t('Copy Link')}
                        </Button>

                        <Button
                          variant="destructive"
                          loading={disableShareMutation.isPending}
                          onClick={handleDisableShare}
                        >
                          {t('Disable Public Share')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      Icon={LuShare2}
                      loading={enableShareMutation.isPending}
                      onClick={handleEnableShare}
                    >
                      {t('Enable Public Share')}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="text-lg font-bold">
                  {t('Danger Zone')}
                </CardHeader>
                <CardContent>
                  <div>
                    <AlertConfirm
                      title={t('Delete Website') + ' ' + website.name}
                      onConfirm={() => handleDeleteWebsite()}
                    >
                      <Button variant="destructive" Icon={LuTrash}>
                        {t('Delete Website')}
                      </Button>
                    </AlertConfirm>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }
);
WebsiteConfig.displayName = 'WebsiteConfig';

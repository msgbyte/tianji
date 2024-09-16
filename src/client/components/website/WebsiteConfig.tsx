import { Form, Input, message } from 'antd';
import React from 'react';
import { deleteWorkspaceWebsite } from '../../api/model/website';
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

    const handleSave = useEvent(
      async (values: { name: string; domain: string; monitorId: string }) => {
        await updateMutation.mutateAsync({
          workspaceId,
          websiteId,
          name: values.name,
          domain: values.domain,
          monitorId: values.monitorId,
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
      await deleteWorkspaceWebsite(workspaceId, websiteId!);

      message.success(t('Delete Success'));

      await trpcUtils.website.all.refetch({ workspaceId });

      navigate({
        to: '/website',
      });
    });

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
                  {t('Danger Zone')}
                </CardHeader>
                <CardContent>
                  <div>
                    <AlertConfirm
                      title={t('Delete Website')}
                      onConfirm={() => handleDeleteWebsite()}
                    >
                      <Button variant="destructive">
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

import { Button, Form, Input, message, Popconfirm, Tabs } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useRequest } from '../../hooks/useRequest';
import { useCurrentWorkspaceId } from '../../store/user';
import { ErrorTip } from '../ErrorTip';
import { Loading } from '../Loading';
import { NoWorkspaceTip } from '../NoWorkspaceTip';
import { MonitorPickerOld } from '../monitor/MonitorPicker';
import {
  defaultErrorHandler,
  defaultSuccessHandler,
  getQueryKey,
  trpc,
} from '../../api/trpc';
import { useQueryClient } from '@tanstack/react-query';
import { useEvent } from '../../hooks/useEvent';
import { hostnameValidator } from '../../utils/validator';
import { useTranslation } from '@i18next-toolkit/react';

export const WebsiteInfo: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { websiteId } = useParams<{
    websiteId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trpcUtils = trpc.useUtils();

  const { data: website, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId: websiteId!,
  });

  const updateMutation = trpc.website.updateInfo.useMutation({
    onSuccess: () => {
      queryClient.resetQueries({
        queryKey: getQueryKey(trpc.website.info),
      });
      defaultSuccessHandler();
    },
    onError: defaultErrorHandler,
  });
  const deleteMutation = trpc.website.delete.useMutation({
    onError: defaultErrorHandler,
  });

  const handleSave = useEvent(
    async (values: { name: string; domain: string; monitorId: string }) => {
      await updateMutation.mutateAsync({
        workspaceId,
        websiteId: websiteId!,
        name: values.name,
        domain: values.domain,
        monitorId: values.monitorId,
      });
    }
  );

  const [, handleDeleteWebsite] = useRequest(async () => {
    if (!websiteId) {
      return;
    }

    await deleteMutation.mutateAsync({ workspaceId, websiteId });
    await trpcUtils.website.all.refetch({ workspaceId });

    message.success(t('Delete Success'));

    navigate('/settings/websites');
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
      <div className="flex h-24 items-center">
        <div className="flex-1 text-2xl">{t('Website Info')}</div>
      </div>

      <div>
        <Tabs>
          <Tabs.TabPane key={'detail'} tab={'Detail'}>
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
                <Button size="large" htmlType="submit">
                  {t('Save')}
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          <Tabs.TabPane key={'data'} tab={'Data'}>
            <Popconfirm
              title={t('Delete Website') + ' ' + website.name}
              onConfirm={() => handleDeleteWebsite()}
            >
              <Button type="primary" danger={true}>
                {t('Delete Website')}
              </Button>
            </Popconfirm>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
});
WebsiteInfo.displayName = 'WebsiteInfo';

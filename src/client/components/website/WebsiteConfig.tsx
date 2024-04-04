import { Button, Form, Input, message, Popconfirm, Tabs } from 'antd';
import React from 'react';
import { deleteWorkspaceWebsite } from '../../api/model/website';
import { useRequest } from '../../hooks/useRequest';
import { useCurrentWorkspaceId } from '../../store/user';
import { ErrorTip } from '../ErrorTip';
import { Loading } from '../Loading';
import { NoWorkspaceTip } from '../NoWorkspaceTip';
import { MonitorPicker } from '../monitor/MonitorPicker';
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
import { useNavigate } from '@tanstack/react-router';

export const WebsiteConfig: React.FC<{ websiteId: string }> = React.memo(
  (props) => {
    const { websiteId } = props;
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: website, isLoading } = trpc.website.info.useQuery({
      workspaceId,
      websiteId,
    });

    const updateMutation = trpc.website.updateInfo.useMutation({
      onSuccess: () => {
        queryClient.resetQueries(getQueryKey(trpc.website.info));
        defaultSuccessHandler();
      },
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
      }
    );

    const [, handleDeleteWebsite] = useRequest(async () => {
      await deleteWorkspaceWebsite(workspaceId, websiteId!);

      message.success(t('Delete Success'));

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
                  <MonitorPicker size="large" allowClear={true} />
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
                title={t('Delete Website')}
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
  }
);
WebsiteConfig.displayName = 'WebsiteConfig';

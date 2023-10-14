import { Button, Form, Input, message, Popconfirm, Tabs } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  deleteWorkspaceWebsite,
  useWorkspaceWebsiteInfo,
} from '../api/model/website';
import { useRequest } from '../hooks/useRequest';
import { useCurrentWorkspaceId } from '../store/user';
import { ErrorTip } from './ErrorTip';
import { Loading } from './Loading';
import { NoWorkspaceTip } from './NoWorkspaceTip';
import { MonitorPicker } from './monitor/MonitorPicker';
import { defaultErrorHandler, defaultSuccessHandler, trpc } from '../api/trpc';
import { useQueryClient } from '@tanstack/react-query';
import { useEvent } from '../hooks/useEvent';

export const WebsiteInfo: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const { websiteId } = useParams<{
    websiteId: string;
  }>();
  const { website, isLoading } = useWorkspaceWebsiteInfo(
    workspaceId,
    websiteId!
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateMutation = trpc.website.updateInfo.useMutation({
    onSuccess: () => {
      queryClient.resetQueries(['websites', workspaceId]); // TODO: translation to trpc
      defaultSuccessHandler();
    },
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
    await deleteWorkspaceWebsite(workspaceId, websiteId!);

    message.success('Delete Success');

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
      <div className="h-24 flex items-center">
        <div className="text-2xl flex-1">Website Info</div>
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
              <Form.Item label="Website ID" name="id">
                <Input size="large" disabled={true} />
              </Form.Item>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
              <Form.Item
                label="Domain"
                name="domain"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item label="Monitor" name="monitorId">
                <MonitorPicker size="large" allowClear={true} />
              </Form.Item>

              <Form.Item>
                <Button size="large" htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>

          <Tabs.TabPane key={'data'} tab={'Data'}>
            <Popconfirm
              title="Delete Website"
              onConfirm={() => handleDeleteWebsite()}
            >
              <Button type="primary" danger={true}>
                Delete Website
              </Button>
            </Popconfirm>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
});
WebsiteInfo.displayName = 'WebsiteInfo';

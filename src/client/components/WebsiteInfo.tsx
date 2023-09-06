import { Button, Form, Input, message, Popconfirm, Tabs } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  deleteWorkspaceWebsite,
  updateWorkspaceWebsiteInfo,
  useWorkspaceWebsiteInfo,
} from '../api/model/website';
import { useRequest } from '../hooks/useRequest';
import { useCurrentWorkspaceId } from '../store/user';
import { ErrorTip } from './ErrorTip';
import { Loading } from './Loading';
import { NoWorkspaceTip } from './NoWorkspaceTip';

export const WebsiteInfo: React.FC = React.memo(() => {
  const { websiteId } = useParams<{
    websiteId: string;
  }>();
  const currentWorkspaceId = useCurrentWorkspaceId();
  const { website, isLoading } = useWorkspaceWebsiteInfo(
    currentWorkspaceId!,
    websiteId!
  );
  const navigate = useNavigate();

  const [, handleSave] = useRequest(
    async (values: { name: string; domain: string }) => {
      await updateWorkspaceWebsiteInfo(currentWorkspaceId!, websiteId!, {
        name: values.name,
        domain: values.domain,
      });

      message.success('Save Success');
    }
  );

  const [, handleDeleteWebsite] = useRequest(async () => {
    await deleteWorkspaceWebsite(currentWorkspaceId!, websiteId!);

    message.success('Delete Success');

    navigate('/settings/websites');
  });

  if (!currentWorkspaceId) {
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

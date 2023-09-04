import {
  BarChartOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import {
  addWorkspaceWebsite,
  refreshWorkspaceWebsites,
  useWorspaceWebsites,
  WebsiteInfo,
} from '../api/model/website';
import { Loading } from '../components/Loading';
import { NoWorkspaceTip } from '../components/NoWorkspaceTip';
import { useRequest } from '../hooks/useRequest';
import { useUserStore } from '../store/user';

export const Website: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentWorkspace = useUserStore(
    (state) => state.info?.currentWorkspace
  );
  const [form] = Form.useForm();

  const [{ loading }, handleAddWebsite] = useRequest(async () => {
    await form.validateFields();
    const values = form.getFieldsValue();

    await addWorkspaceWebsite(currentWorkspace!.id, values.name, values.domain);
    refreshWorkspaceWebsites(currentWorkspace!.id);
    setIsModalOpen(false);

    form.resetFields();
  });

  if (!currentWorkspace) {
    return <NoWorkspaceTip />;
  }

  return (
    <div>
      <div className="h-24 flex items-center">
        <div className="text-2xl flex-1">Websites</div>
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setIsModalOpen(true)}
          >
            Add Website
          </Button>
        </div>
      </div>

      <WebsiteList workspaceId={currentWorkspace.id} />

      <Modal
        title="Add Server"
        open={isModalOpen}
        okButtonProps={{
          loading,
        }}
        onOk={() => handleAddWebsite()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Server Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Domain" name="domain" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
Website.displayName = 'Website';

const WebsiteList: React.FC<{ workspaceId: string }> = React.memo((props) => {
  const { websites, isLoading } = useWorspaceWebsites(props.workspaceId);

  const columns = useMemo((): ColumnsType<WebsiteInfo> => {
    return [
      {
        dataIndex: 'name',
        title: 'Name',
      },
      {
        dataIndex: 'domain',
        title: 'Domain',
      },
      {
        key: 'action',
        render: () => {
          return (
            <div className="flex gap-2 justify-end">
              <Button icon={<EditOutlined />}>Edit</Button>
              <Button icon={<BarChartOutlined />}>View</Button>
            </div>
          );
        },
      },
    ];
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return <Table columns={columns} dataSource={websites} pagination={false} />;
});
WebsiteList.displayName = 'WebsiteList';

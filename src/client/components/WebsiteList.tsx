import {
  BarChartOutlined,
  CodeOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import {
  addWorkspaceWebsite,
  refreshWorkspaceWebsites,
  useWorspaceWebsites,
  WebsiteInfo,
} from '../api/model/website';
import { Loading } from './Loading';
import { NoWorkspaceTip } from './NoWorkspaceTip';
import { useRequest } from '../hooks/useRequest';
import { useUserStore } from '../store/user';
import { useEvent } from '../hooks/useEvent';
import { useNavigate } from 'react-router';
import { PageHeader } from './PageHeader';
import { ModalButton } from './ModalButton';

export const WebsiteList: React.FC = React.memo(() => {
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
      <PageHeader
        title="Websites"
        action={
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
        }
      />

      <WebsiteListTable workspaceId={currentWorkspace.id} />

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
WebsiteList.displayName = 'WebsiteList';

const WebsiteListTable: React.FC<{ workspaceId: string }> = React.memo(
  (props) => {
    const { websites, isLoading } = useWorspaceWebsites(props.workspaceId);
    const navigate = useNavigate();

    const handleEdit = useEvent((websiteId) => {
      navigate(`/settings/website/${websiteId}`);
    });

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
          render: (_, record) => {
            const trackScript = `<script async defer src="${location.origin}/tracker.js" data-website-id="${record.id}"></script>`;

            return (
              <div className="flex gap-2 justify-end">
                <ModalButton
                  buttonProps={{
                    icon: <CodeOutlined />,
                    children: 'Code',
                  }}
                  modalProps={{
                    children: (
                      <div>
                        <div>Tracking code</div>
                        <div className="text-sm opacity-60">
                          Add this code into your website head script
                        </div>
                        <Typography.Paragraph
                          copyable={{
                            format: 'text/plain',
                            text: trackScript,
                          }}
                          className="h-[96px] flex p-2 rounded bg-black bg-opacity-5 border border-black border-opacity-10 overflow-auto"
                        >
                          <span>{trackScript}</span>
                        </Typography.Paragraph>
                      </div>
                    ),
                  }}
                />
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record.id)}
                >
                  Edit
                </Button>
                <Button
                  icon={<BarChartOutlined />}
                  onClick={() => {
                    navigate(`/website/${record.id}`);
                  }}
                >
                  View
                </Button>
              </div>
            );
          },
        },
      ] as ColumnsType<WebsiteInfo>;
    }, []);

    if (isLoading) {
      return <Loading />;
    }

    return (
      <Table
        rowKey="id"
        columns={columns}
        dataSource={websites}
        pagination={false}
      />
    );
  }
);
WebsiteListTable.displayName = 'WebsiteListTable';

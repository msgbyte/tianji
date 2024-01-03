import {
  BarChartOutlined,
  CodeOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { WebsiteInfo } from '../../api/model/website';
import { Loading } from '../Loading';
import { useCurrentWorkspaceId } from '../../store/user';
import { useEvent } from '../../hooks/useEvent';
import { useNavigate } from 'react-router';
import { PageHeader } from '../PageHeader';
import { ModalButton } from '../ModalButton';
import { hostnameValidator } from '../../utils/validator';
import { trpc } from '../../api/trpc';

export const WebsiteList: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const workspaceId = useCurrentWorkspaceId();
  const [form] = Form.useForm();
  const addWebsiteMutation = trpc.website.add.useMutation();
  const utils = trpc.useContext();

  const handleAddWebsite = useEvent(async () => {
    await form.validateFields();
    const values = form.getFieldsValue();

    await addWebsiteMutation.mutateAsync({
      workspaceId,
      name: values.name,
      domain: values.domain,
    });

    utils.website.all.refetch();

    setIsModalOpen(false);

    form.resetFields();
  });

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

      <WebsiteListTable workspaceId={workspaceId} />

      <Modal
        title="Add Website"
        open={isModalOpen}
        okButtonProps={{
          loading: addWebsiteMutation.isLoading,
        }}
        onOk={() => handleAddWebsite()}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Website Name"
            name="name"
            tooltip="Website Name to Display"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Domain"
            name="domain"
            tooltip="Your server domain, or ip."
            rules={[
              { required: true },
              {
                validator: hostnameValidator,
              },
            ]}
          >
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
    const { data: websites = [], isLoading } = trpc.website.all.useQuery({
      workspaceId: props.workspaceId,
    });
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

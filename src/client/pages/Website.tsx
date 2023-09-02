import {
  BarChartOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';

export const Website: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="h-24 flex items-center">
        <div className="text-2xl flex-1">Servers</div>
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

      <WebsiteList />

      <Modal
        title="Add Server"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Server Name">
            <Input />
          </Form.Item>
          <Form.Item label="Domain">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
Website.displayName = 'Website';

interface WebsiteInfoRecordType {
  name: string;
  domain: string;
}

const WebsiteList: React.FC = React.memo(() => {
  const dataSource: WebsiteInfoRecordType[] = [
    {
      name: 'tianji',
      domain: 'tianji.msgbyte.com',
    },
  ];

  const columns = useMemo((): ColumnsType<WebsiteInfoRecordType> => {
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

  return <Table columns={columns} dataSource={dataSource} pagination={false} />;
});
WebsiteList.displayName = 'WebsiteList';

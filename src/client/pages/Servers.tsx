import React, { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';

export const Servers: React.FC = React.memo(() => {
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
            Add Server
          </Button>
        </div>
      </div>

      <ServerList />

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
        </Form>
      </Modal>
    </div>
  );
});
Servers.displayName = 'Servers';

interface ServerInfoRecordType {
  status: 'online' | 'offline';
  nodeName: string;
  type: string; // KVM | Hyper-V
  location: string;
  uptime: number; // second
  load: number;
  network: string;
  traffic: string;
  cpu: string;
  ram: string;
  hdd: string;
}

export const ServerList: React.FC = React.memo(() => {
  const dataSource: ServerInfoRecordType[] = [
    {
      status: 'online',
      nodeName: 'node1',
      type: 'KVM',
      location: 'Chicago',
      uptime: 82989,
      load: 0.2,
      network: '82.9K | 89.3K',
      traffic: '21.6G | 18.3G',
      cpu: '5%',
      ram: '1G/2G',
      hdd: '25G/30G',
    },
  ];

  const columns = useMemo((): ColumnsType<ServerInfoRecordType> => {
    return [
      {
        dataIndex: 'status',
        title: 'Status',
      },
      {
        dataIndex: 'nodeName',
        title: 'Node Name',
      },
      {
        dataIndex: 'type',
        title: 'Type',
      },
      {
        dataIndex: 'uptime',
        title: 'Uptime',
      },
      {
        dataIndex: 'load',
        title: 'Load',
      },
      {
        dataIndex: 'network',
        title: 'Network',
      },
      {
        dataIndex: 'traffic',
        title: 'Traffic',
      },
      {
        dataIndex: 'cpu',
        title: 'cpu',
      },
      {
        dataIndex: 'ram',
        title: 'ram',
      },
      {
        dataIndex: 'hdd',
        title: 'hdd',
      },
    ];
  }, []);

  return <Table columns={columns} dataSource={dataSource} pagination={false} />;
});
ServerList.displayName = 'ServerList';

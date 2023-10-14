import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Form,
  Input,
  Modal,
  Steps,
  Table,
  Typography,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { ServerStatusInfo } from '../../types';
import { useSocketSubscribe } from '../api/socketio';
import { filesize } from 'filesize';
import prettyMilliseconds from 'pretty-ms';
import { UpDownCounter } from '../components/UpDownCounter';
import { max } from 'lodash-es';
import dayjs from 'dayjs';
import { useCurrentWorkspaceId } from '../store/user';
import { useWatch } from '../hooks/useWatch';
import { Loading } from '../components/Loading';
import { without } from 'lodash-es';

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
        destroyOnClose={true}
        okText="Done"
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <div>
          <AddServerStep />
        </div>
      </Modal>
    </div>
  );
});
Servers.displayName = 'Servers';

function useServerMap(): Record<string, ServerStatusInfo> {
  const serverMap = useSocketSubscribe<Record<string, ServerStatusInfo>>(
    'onServerStatusUpdate',
    {}
  );

  return serverMap;
}

export const ServerList: React.FC = React.memo(() => {
  const serverMap = useServerMap();

  const dataSource = Object.values(serverMap);
  const lastUpdatedAt = max(dataSource.map((d) => d.updatedAt));

  const columns = useMemo((): ColumnsType<ServerStatusInfo> => {
    return [
      {
        key: 'status',
        title: 'Status',
        render: (val, record) => {
          return Date.now() - (record.updatedAt + record.timeout) < 0 ? (
            <Badge status="success" text="online" />
          ) : (
            <Badge status="error" text="offline" />
          );
        },
      },
      {
        dataIndex: 'name',
        title: 'Node Name',
      },
      {
        dataIndex: 'hostname',
        title: 'Host Name',
      },
      {
        dataIndex: ['payload', 'system'],
        title: 'System',
      },
      {
        dataIndex: ['payload', 'uptime'],
        title: 'Uptime',
        render: (val) => prettyMilliseconds(Number(val) * 1000),
      },
      {
        dataIndex: ['payload', 'load'],
        title: 'Load',
      },
      {
        key: 'nework',
        title: 'Network',
        render: (_, record) => {
          return (
            <UpDownCounter
              up={filesize(record.payload.network_out)}
              down={filesize(record.payload.network_in)}
            />
          );
        },
      },
      {
        key: 'traffic',
        title: 'Traffic',
        render: (_, record) => {
          return (
            <UpDownCounter
              up={filesize(record.payload.network_tx) + '/s'}
              down={filesize(record.payload.network_rx) + '/s'}
            />
          );
        },
      },
      {
        dataIndex: ['payload', 'cpu'],
        title: 'cpu',
        render: (val) => `${val}%`,
      },
      {
        key: 'ram',
        title: 'ram',
        render: (_, record) => {
          return `${filesize(record.payload.memory_used * 1000)} / ${filesize(
            record.payload.memory_total * 1000
          )}`;
        },
      },
      {
        key: 'hdd',
        title: 'hdd',
        render: (_, record) => {
          return `${filesize(record.payload.hdd_used * 1000)} / ${filesize(
            record.payload.hdd_total * 1000
          )}`;
        },
      },
    ];
  }, []);

  return (
    <div>
      <div className="text-right text-sm opacity-80">
        Last updated at: {dayjs(lastUpdatedAt).format('YYYY-MM-DD HH:mm:ss')}
      </div>
      <Table
        rowKey="hostname"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      />
    </div>
  );
});
ServerList.displayName = 'ServerList';

export const AddServerStep: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const [current, setCurrent] = useState(0);
  const serverMap = useServerMap();
  const [checking, setChecking] = useState(false);
  const oldServerMapNames = useRef<string[]>([]);
  const [diffServerNames, setDiffServerNames] = useState<string[]>([]);

  const allServerNames = useMemo(() => Object.keys(serverMap), [serverMap]);

  useWatch([checking], () => {
    if (checking === true) {
      oldServerMapNames.current = [...allServerNames];
    }
  });

  useWatch([allServerNames], () => {
    if (checking === true) {
      setDiffServerNames(without(allServerNames, ...oldServerMapNames.current));
    }
  });

  return (
    <Steps
      direction="vertical"
      current={current}
      items={[
        {
          title: 'Download Client Reportor',
          description: (
            <div>
              Download reporter from{' '}
              <Typography.Link
                href="https://github.com/msgbyte/tianji/releases"
                target="_blank"
                onClick={() => {
                  if (current === 0) {
                    setCurrent(1);
                    setChecking(true);
                  }
                }}
              >
                Releases Page
              </Typography.Link>
            </div>
          ),
        },
        {
          title: 'Run',
          description: (
            <div>
              run reporter with{' '}
              <Typography.Text code={true} copyable={true}>
                ./tianji-reporter --url {window.location.origin} --workspace{' '}
                {workspaceId}
              </Typography.Text>
              <Button
                type="link"
                size="small"
                disabled={current !== 1}
                onClick={() => {
                  if (current === 1) {
                    setCurrent(2);
                    setChecking(true);
                  }
                }}
              >
                Next step
              </Button>
            </div>
          ),
        },
        {
          title: 'Waiting for receive UDP pack',
          description: (
            <div>
              {diffServerNames.length === 0 || checking === false ? (
                <Loading />
              ) : (
                <div>
                  Is this your servers?
                  {diffServerNames.map((n) => (
                    <div key={n}>- {n}</div>
                  ))}
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
});
AddServerStep.displayName = 'AddServerStep';

import React, { useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  Empty,
  Modal,
  Popconfirm,
  Steps,
  Switch,
  Table,
  Tabs,
  Tooltip,
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
import { useIntervalUpdate } from '../hooks/useIntervalUpdate';
import clsx from 'clsx';
import { isServerOnline } from '../../shared';
import { defaultErrorHandler, trpc } from '../api/trpc';
import { useRequest } from '../hooks/useRequest';

export const Servers: React.FC = React.memo(() => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hideOfflineServer, setHideOfflineServer] = useState(false);
  const workspaceId = useCurrentWorkspaceId();

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const clearOfflineNodeMutation =
    trpc.serverStatus.clearOfflineServerStatus.useMutation({
      onError: defaultErrorHandler,
    });

  const [{ loading }, handleClearOfflineNode] = useRequest(async (e) => {
    await clearOfflineNodeMutation.mutateAsync({
      workspaceId,
    });
  });

  return (
    <div>
      <div className="h-24 flex items-center">
        <div className="text-2xl flex-1">Servers</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-500">
            <Switch
              checked={hideOfflineServer}
              onChange={setHideOfflineServer}
            />
            Hide Offline
          </div>

          <div>
            <Popconfirm
              title="Clear Offline Node"
              description="Are you sure to clear all offline node?"
              disabled={loading}
              onConfirm={handleClearOfflineNode}
            >
              <Button size="large" loading={loading}>
                Clear Offline
              </Button>
            </Popconfirm>
          </div>

          <Divider type="vertical" />

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

      <ServerList hideOfflineServer={hideOfflineServer} />

      <Modal
        title="Add Server"
        open={isModalOpen}
        destroyOnClose={true}
        okText="Done"
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <div>
          <Tabs
            items={[
              {
                key: 'auto',
                label: 'Auto',
                children: <InstallScript />,
              },
              {
                key: 'manual',
                label: 'Manual',
                children: <AddServerStep />,
              },
            ]}
          />
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

export const ServerList: React.FC<{
  hideOfflineServer: boolean;
}> = React.memo((props) => {
  const serverMap = useServerMap();
  const inc = useIntervalUpdate(2 * 1000);
  const { hideOfflineServer } = props;

  const dataSource = useMemo(
    () =>
      Object.values(serverMap)
        .sort((info) => (isServerOnline(info) ? -1 : 1))
        .filter((info) => {
          if (hideOfflineServer) {
            return isServerOnline(info);
          }

          return true;
        }), // make online server is up and offline is down
    [serverMap, inc, hideOfflineServer]
  );
  const lastUpdatedAt = max(dataSource.map((d) => d.updatedAt));

  const columns = useMemo((): ColumnsType<ServerStatusInfo> => {
    return [
      {
        key: 'status',
        title: 'Status',
        width: 90,
        render: (val, record) => {
          return isServerOnline(record) ? (
            <Badge status="success" text="online" />
          ) : (
            <Tooltip
              title={`Last online: ${dayjs(record.updatedAt).format(
                'YYYY-MM-DD HH:mm:ss'
              )}`}
            >
              <Badge status="error" text="offline" />
            </Tooltip>
          );
        },
      },
      {
        dataIndex: 'name',
        title: 'Node Name',
        width: 150,
        ellipsis: true,
      },
      {
        dataIndex: 'hostname',
        title: 'Host Name',
        width: 150,
        ellipsis: true,
      },
      // {
      //   dataIndex: ['payload', 'system'],
      //   title: 'System',
      // },
      {
        dataIndex: ['payload', 'uptime'],
        title: 'Uptime',
        width: 150,
        render: (val) => prettyMilliseconds(Number(val) * 1000),
      },
      {
        dataIndex: ['payload', 'load'],
        title: 'Load',
        width: 70,
      },
      {
        key: 'nework',
        title: 'Network',
        width: 110,
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
        width: 120,
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
        title: 'CPU',
        width: 80,
        render: (val) => `${val}%`,
      },
      {
        key: 'ram',
        title: 'RAM',
        width: 120,
        render: (_, record) => {
          return (
            <div className="text-xs">
              <div>{filesize(record.payload.memory_used * 1000)} / </div>
              <div>{filesize(record.payload.memory_total * 1000)}</div>
            </div>
          );
        },
      },
      {
        key: 'hdd',
        title: 'HDD',
        width: 120,
        render: (_, record) => {
          return (
            <div className="text-xs">
              <div>{filesize(record.payload.hdd_used * 1000 * 1000)} / </div>
              <div>{filesize(record.payload.hdd_total * 1000 * 1000)}</div>
            </div>
          );
        },
      },
      {
        dataIndex: 'updatedAt',
        title: 'updatedAt',
        width: 130,
        render: (val) => {
          return dayjs(val).format('MMM D HH:mm:ss');
        },
      },
    ];
  }, []);

  return (
    <div>
      <div className="text-right text-sm opacity-80">
        Last updated at: {dayjs(lastUpdatedAt).format('YYYY-MM-DD HH:mm:ss')}
      </div>
      <div className="overflow-auto">
        <Table
          rowKey="hostname"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          locale={{ emptyText: <Empty description="No server online" /> }}
          rowClassName={(record) =>
            clsx(!isServerOnline(record) && 'opacity-60')
          }
        />
      </div>
    </div>
  );
});
ServerList.displayName = 'ServerList';

export const InstallScript: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const command = `curl -o- ${window.location.origin}/serverStatus/${workspaceId}/install.sh?url=${window.location.origin} | bash`;

  return (
    <div>
      <div>Run this command in your linux machine</div>

      <Typography.Paragraph
        copyable={{
          format: 'text/plain',
          text: command,
        }}
        className="h-[96px] flex p-2 rounded bg-black bg-opacity-5 border border-black border-opacity-10 overflow-auto"
      >
        <span>{command}</span>
      </Typography.Paragraph>

      <div>
        Or you wanna report server status in windows server? switch to Manual
        tab
      </div>
    </div>
  );
});

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

  const command = `./tianji-reporter --url ${window.location.origin} --workspace ${workspaceId}`;

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
              run reporter with:{' '}
              <Typography.Text
                code={true}
                copyable={{ format: 'text/plain', text: command }}
              >
                {command}
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

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
import { isServerOnline } from '@tianji/shared';
import { defaultErrorHandler, trpc } from '../api/trpc';
import { useRequest } from '../hooks/useRequest';
import { useTranslation } from '@i18next-toolkit/react';

export const Servers: React.FC = React.memo(() => {
  const { t } = useTranslation();
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
      <div className="flex h-24 items-center">
        <div className="flex-1 text-2xl">{t('Servers')}</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-500">
            <Switch
              checked={hideOfflineServer}
              onChange={setHideOfflineServer}
            />
            {t('Hide Offline')}
          </div>

          <div>
            <Popconfirm
              title={t('Clear Offline Node')}
              description={t('Are you sure to clear all offline node?')}
              disabled={loading}
              onConfirm={handleClearOfflineNode}
            >
              <Button size="large" loading={loading}>
                {t('Clear Offline')}
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
            {t('Add Server')}
          </Button>
        </div>
      </div>

      <ServerList hideOfflineServer={hideOfflineServer} />

      <Modal
        title={t('Add Server')}
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
                label: t('Auto'),
                children: <InstallScript />,
              },
              {
                key: 'manual',
                label: t('Manual'),
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
  const { t } = useTranslation();
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
        title: t('Status'),
        width: 90,
        render: (val, record) => {
          return isServerOnline(record) ? (
            <Badge status="success" text={t('online')} />
          ) : (
            <Tooltip
              title={t('Last online: {{time}}', {
                time: dayjs(record.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
              })}
            >
              <Badge status="error" text="offline" />
            </Tooltip>
          );
        },
      },
      {
        dataIndex: 'name',
        title: t('Node Name'),
        width: 150,
        ellipsis: true,
      },
      {
        dataIndex: 'hostname',
        title: t('Host Name'),
        width: 150,
        ellipsis: true,
      },
      // {
      //   dataIndex: ['payload', 'system'],
      //   title: 'System',
      // },
      {
        dataIndex: ['payload', 'uptime'],
        title: t('Uptime'),
        width: 150,
        render: (val) => prettyMilliseconds(Number(val) * 1000),
      },
      {
        dataIndex: ['payload', 'load'],
        title: t('Load'),
        width: 70,
      },
      {
        key: 'nework',
        title: t('Network'),
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
        title: t('Traffic'),
        width: 130,
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
        title: t('CPU'),
        width: 80,
        render: (val) => `${val}%`,
      },
      {
        key: 'ram',
        title: t('RAM'),
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
        title: t('HDD'),
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
        title: t('updatedAt'),
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
        {t('Last updated at: {{date}}', {
          date: dayjs(lastUpdatedAt).format('YYYY-MM-DD HH:mm:ss'),
        })}
      </div>
      <div className="overflow-auto">
        <Table
          rowKey="hostname"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          locale={{ emptyText: <Empty description={t('No server online')} /> }}
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
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const command = `curl -o- ${window.location.origin}/serverStatus/${workspaceId}/install.sh?url=${window.location.origin} | bash`;

  return (
    <div>
      <div>{t('Run this command in your linux machine')}</div>

      <Typography.Paragraph
        copyable={{
          format: 'text/plain',
          text: command,
        }}
        className="flex h-[96px] overflow-auto rounded border border-black border-opacity-10 bg-black bg-opacity-5 p-2"
      >
        <span>{command}</span>
      </Typography.Paragraph>

      <div>
        {t(
          'Or you wanna report server status in windows server? switch to Manual tab'
        )}
      </div>
    </div>
  );
});

export const AddServerStep: React.FC = React.memo(() => {
  const { t } = useTranslation();
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
          title: t('Download Client Reportor'),
          description: (
            <div>
              {t('Download reporter from')}{' '}
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
                {t('Releases Page')}
              </Typography.Link>
            </div>
          ),
        },
        {
          title: t('Run'),
          description: (
            <div>
              {t('run reporter with')}:{' '}
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
                {t('Next step')}
              </Button>
            </div>
          ),
        },
        {
          title: t('Waiting for receive report pack'),
          description: (
            <div>
              {diffServerNames.length === 0 || checking === false ? (
                <Loading />
              ) : (
                <div>
                  {t('Is this your servers?')}
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

import React, { useMemo, useRef, useState } from 'react';
import { Button, Steps, Typography } from 'antd';
import { useCurrentWorkspaceId } from '../../store/user';
import { useWatch } from '../../hooks/useWatch';
import { Loading } from '../Loading';
import { without } from 'lodash-es';
import { useTranslation } from '@i18next-toolkit/react';
import { useSocketSubscribeData } from '@/api/socketio';
import { ServerStatusInfo } from '../../../types';

function useServerMap(): Record<string, ServerStatusInfo> {
  const serverMap = useSocketSubscribeData<Record<string, ServerStatusInfo>>(
    'onServerStatusUpdate',
    {}
  );

  return serverMap;
}

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

  const command = `./tianji-reporter --url ${window.location.origin} --workspace ${workspaceId} [--secret <your-secret>]`;

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

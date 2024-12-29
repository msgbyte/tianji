import { Button, Form, Modal } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';
import { CodeEditor } from '../../CodeEditor';
import { defaultErrorHandler, trpc } from '../../../api/trpc';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useCurrentWorkspaceId } from '../../../store/user';
import { useEvent } from '../../../hooks/useEvent';
import dayjs from 'dayjs';
import { ColorTag } from '../../ColorTag';
import { Trans, useTranslation } from '@i18next-toolkit/react';

export const MonitorCustom: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const testScriptMutation = trpc.monitor.testCustomScript.useMutation({
    onError: defaultErrorHandler,
  });
  const form = Form.useFormInstance();
  const [modal, contextHolder] = Modal.useModal();

  const handleTestCode = useEvent(async () => {
    const { logger, result, usage } = await testScriptMutation.mutateAsync({
      workspaceId,
      code: form.getFieldValue(['payload', 'code']),
    });

    modal.info({
      centered: true,
      maskClosable: true,
      title: t('Run Completed'),
      width: 'clamp(320px, 60vw, 860px)',
      content: (
        <div>
          {logger.map(([type, time, ...args]) => (
            <div className="mb-1">
              {type === 'warn' ? (
                <ColorTag label={type} colors={['orange']} />
              ) : type === 'error' ? (
                <ColorTag label={type} colors={['red']} />
              ) : (
                <ColorTag label={type} colors={['geekblue']} />
              )}

              <span className="mr-1 text-neutral-500">
                {dayjs(time).format('HH:mm:ss')}
              </span>

              <span className="break-all">{args.join(' ')}</span>
            </div>
          ))}

          <div>{t('Usage: {{usage}}ms', { usage })} </div>
          <div>
            {t('Result')}: <span className="font-semibold">{result}</span>
          </div>
        </div>
      ),
    });
  });

  return (
    <>
      <Form.Item
        label={t('Script JS Code')}
        name={['payload', 'code']}
        rules={[{ required: true }]}
      >
        <CodeEditor height={320} />
      </Form.Item>
      <Button
        loading={testScriptMutation.isPending}
        icon={<PlayCircleOutlined />}
        onClick={handleTestCode}
      >
        {t('Test Code')}
      </Button>
      {contextHolder}
    </>
  );
});
MonitorCustom.displayName = 'MonitorCustom';

export const customProvider: MonitorProvider = {
  label: <Trans>Custom</Trans>,
  name: 'custom',
  form: MonitorCustom,
  valueLabel: 'Result',
  valueFormatter: (value) => String(value),
};

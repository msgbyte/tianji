import { Form, Input, InputNumber, Typography } from 'antd';
import React, { useEffect } from 'react';
import { MonitorProvider } from './types';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import { LuInfo } from 'react-icons/lu';
import copy from 'copy-to-clipboard';

const MonitorPush: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const form = Form.useFormInstance();
  const pushToken = Form.useWatch(['payload', 'pushToken'], form);

  const pushUrl = `${window.location.origin}/api/push/${pushToken}`;
  const downPushUrl = `${window.location.origin}/api/push/${pushToken}?status=down`;

  const handleCopyPushUrl = useEvent(() => {
    copy(pushUrl);
  });

  return (
    <>
      <Typography.Paragraph className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <Typography.Text strong>{t('Push Monitoring')}</Typography.Text>
        <div className="mt-2 text-sm">
          {t(
            'Push monitoring allows your application or service to regularly send HTTP requests to a specified URL to indicate its normal operation. If Tianji does not receive a push request within a certain period, it will mark the monitoring as interrupted and send a notification.'
          )}
        </div>
      </Typography.Paragraph>

      <Form.Item
        name={['payload', 'pushToken']}
        label={t('Push Token')}
        tooltip={t(
          'Push token is automatically generated after saving, used to verify push requests'
        )}
      >
        <Input.TextArea placeholder={t('Generated after saving')} readOnly />
      </Form.Item>

      {pushToken && (
        <>
          <Form.Item
            label={t('Endpoint URL')}
            tooltip={t(
              'Your application should regularly send HTTP requests to this URL'
            )}
          >
            <div className="flex items-center">
              <Input disabled value={pushUrl} className="mr-2" />
              <Button size="sm" onClick={handleCopyPushUrl}>
                {t('Copy')}
              </Button>
            </div>
          </Form.Item>

          <div className="mb-6 rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-1">
              <LuInfo className="text-lg" />
              <span className="font-semibold">{t('Usage')}</span>
            </div>
            <div className="mt-2">
              <p>
                {t(
                  '1. Push normal status: send GET or POST requests to the above URL to indicate service health.'
                )}
              </p>
              <p>
                {t('2. Push abnormal status: ')}
                <code className="mx-1 rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-800">
                  {downPushUrl}
                </code>
              </p>
              <p>
                {t(
                  '3. You can also use the msg parameter to add a custom message: ?msg=your message'
                )}
              </p>
            </div>
          </div>
        </>
      )}

      <Form.Item
        name={['payload', 'timeout']}
        label={t('Timeout (seconds)')}
        tooltip={t(
          'If no push is received within this time, the service is considered interrupted'
        )}
        initialValue={60}
      >
        <InputNumber min={10} step={10} />
      </Form.Item>
    </>
  );
});

MonitorPush.displayName = 'MonitorPush';

export const pushProvider: MonitorProvider = {
  label: 'Push',
  name: 'push',
  form: MonitorPush,
  valueLabel: 'response time',
  valueFormatter: (value: number) => `${value}ms`,
  minInterval: 10, // 最小10秒间隔运行
};

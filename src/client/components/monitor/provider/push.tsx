import { Form, Input, InputNumber, Typography, Switch, Tooltip } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import { LuInfo, LuRefreshCw } from 'react-icons/lu';
import copy from 'copy-to-clipboard';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { toast } from 'sonner';

const MonitorPush: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const form = Form.useFormInstance();
  const workspaceId = useCurrentWorkspaceId();
  const pushToken = Form.useWatch(['payload', 'pushToken'], form);
  const enableCron = Form.useWatch(['payload', 'enableCron'], form);
  const monitorId = Form.useWatch('id', form);

  const pushUpUrl = `${window.location.origin}/api/push/${pushToken}`;
  const downPushUrl = `${window.location.origin}/api/push/${pushToken}?status=down`;

  const regeneratePushTokenMutation =
    trpc.monitor.regeneratePushToken.useMutation({
      onSuccess: (newToken: string) => {
        form.setFieldValue(['payload', 'pushToken'], newToken);
      },
      onError: defaultErrorHandler,
    });

  const handleCopyPushUrl = useEvent(() => {
    toast.success(t('Copied to clipboard'));
    copy(pushUpUrl);
  });

  const handleRegeneratePushToken = useEvent(async () => {
    if (!monitorId) {
      return;
    }

    await regeneratePushTokenMutation.mutateAsync({
      workspaceId,
      monitorId,
    });
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
        <div className="flex items-center">
          <Input
            placeholder={t('Generated after saving')}
            disabled
            className="mr-2"
            value={pushToken}
          />
          {pushToken && (
            <Tooltip title={t('Rotate Push Token')}>
              <Button
                size="icon"
                variant="outline"
                Icon={LuRefreshCw}
                loading={regeneratePushTokenMutation.isPending}
                onClick={handleRegeneratePushToken}
                type="button"
              />
            </Tooltip>
          )}
        </div>
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
              <Input disabled value={pushUpUrl} className="mr-2" />
              <Button size="sm" type="button" onClick={handleCopyPushUrl}>
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

      <Form.Item
        name={['payload', 'enableCron']}
        label={
          <span className="flex items-center gap-1">
            {t('Enable Cron Schedule')}
            <Tooltip title={t('Check push status based on cron schedule')}>
              <LuInfo className="text-gray-400" />
            </Tooltip>
          </span>
        }
        valuePropName="checked"
        initialValue={false}
      >
        <Switch />
      </Form.Item>

      {enableCron && (
        <>
          <Form.Item
            name={['payload', 'cronExpression']}
            label={t('Cron Expression')}
            tooltip={t(
              'Schedule for push checking (e.g. "*/5 * * * *" for every 5 minutes)'
            )}
            rules={[
              { required: true, message: t('Please input cron expression') },
            ]}
            initialValue="*/5 * * * *"
          >
            <Input placeholder="*/5 * * * *" />
          </Form.Item>

          <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">
            <div className="flex items-center gap-1">
              <LuInfo className="text-lg" />
              <span className="font-semibold">
                {t('Cron Mode Explanation')}
              </span>
            </div>
            <p className="mt-2">{t('When Cron Schedule is enabled:')}</p>
            <ul className="mt-1 list-disc pl-5">
              <li>
                {t(
                  'Push requests are expected to arrive according to the cron schedule'
                )}
              </li>
              <li>
                {t(
                  'Monitoring will fail if no push is received within tolerance period after scheduled time'
                )}
              </li>
              <li>
                {t(
                  'This is useful for monitoring scheduled jobs that should run at specific times'
                )}
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );
});

MonitorPush.displayName = 'MonitorPush';

export const pushProvider: MonitorProvider = {
  label: 'Push',
  name: 'push',
  form: MonitorPush,
  valueLabel: 'value',
  valueFormatter: (value: number) => `${value}`,
  minInterval: 10, // 最小10秒间隔运行
};

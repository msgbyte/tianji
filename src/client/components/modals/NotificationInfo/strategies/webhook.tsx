import { Form, Input } from 'antd';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';

export const NotificationWebhook: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Webhook URL')}
        name={['payload', 'webhookUrl']}
        rules={[{ required: true }]}
      >
        <Input placeholder={t('For example: https://example.com/callback')} />
      </Form.Item>
    </>
  );
});
NotificationWebhook.displayName = 'NotificationWebhook';

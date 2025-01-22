import { Form, Input } from 'antd';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';

export const NotificationTeams: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Teams Webhook URL')}
        name={['payload', 'teamsWebhookUrl']}
        rules={[{ required: true }]}
      >
        <Input placeholder={t('For example: https://example.com/callback')} />
      </Form.Item>
    </>
  );
});
NotificationTeams.displayName = 'NotificationTeams';

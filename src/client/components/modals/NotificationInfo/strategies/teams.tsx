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
        <Input placeholder={t('For example: https://yourorg.webhook.office.com/webhookb2/guid')} />
      </Form.Item>
      <div className="text-sm opacity-80">
        {t('Read more')}:{' '}
        <a
          href="https://learn.microsoft.com/pt-br/azure/data-factory/how-to-send-notifications-to-teams?tabs=data-factory"
          target="_blank"
        >
          https://learn.microsoft.com/pt-br/azure/data-factory/how-to-send-notifications-to-teams?tabs=data-factory
        </a>
      </div>
    </>
  );
});
NotificationTeams.displayName = 'NotificationTeams';

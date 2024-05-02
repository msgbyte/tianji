import { Form, Input } from 'antd';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';

export const NotificationFeishu: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Webhook URL')}
        name={['payload', 'webhookUrl']}
        rules={[{ required: true }]}
      >
        <Input
          placeholder={t(
            'For example: https://open.feishu.cn/open-apis/bot/v2/hook/00000000-0000-0000-0000-000000000000'
          )}
        />
      </Form.Item>
      <div className="text-sm opacity-80">
        {t('Read more')}:{' '}
        <a
          href="https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot?lang=en-US"
          target="_blank"
        >
          https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot?lang=en-US
        </a>
      </div>
    </>
  );
});
NotificationFeishu.displayName = 'NotificationFeishu';

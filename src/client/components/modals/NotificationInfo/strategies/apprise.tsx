import { Form, Input } from 'antd';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';

export const NotificationApprise: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Apprise URL')}
        name={['payload', 'appriseUrl']}
        rules={[{ required: true }]}
      >
        <Input placeholder={t('For example: pushdeer://pushKey')} />
      </Form.Item>
      <div className="text-sm opacity-80">
        {t('Read more')}:{' '}
        <a
          href="https://github.com/caronc/apprise/wiki#notification-services"
          target="_blank"
        >
          https://github.com/caronc/apprise/wiki#notification-services
        </a>
      </div>
    </>
  );
});
NotificationApprise.displayName = 'NotificationApprise';

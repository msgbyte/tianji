import { Form, Input } from 'antd';
import React from 'react';

export const NotificationApprise: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item
        label="Apprise URL"
        name={['payload', 'appriseUrl']}
        rules={[{ required: true }]}
      >
        <Input placeholder="For example: pushdeer://pushKey" />
      </Form.Item>
      <div className="text-sm opacity-80">
        Read more:{' '}
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

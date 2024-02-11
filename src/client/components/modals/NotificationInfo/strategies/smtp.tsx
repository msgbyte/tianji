import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';

export const NotificationSMTP: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Host')}
        name={['payload', 'hostname']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t('Port')}
        name={['payload', 'port']}
        rules={[{ required: true }, { type: 'number', min: 0, max: 65535 }]}
      >
        <InputNumber max={65535} min={1} />
      </Form.Item>
      <Form.Item
        label={t('Security')}
        name={['payload', 'security']}
        initialValue={false}
      >
        <Select>
          <Select.Option value={false}>
            {t('None / STARTTLS')} (25, 587)
          </Select.Option>
          <Select.Option value={true}>TLS (465)</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name={['payload', 'ignoreTLS']} valuePropName="checked">
        <Checkbox>{t('Ignore TLS Error')}</Checkbox>
      </Form.Item>
      <Form.Item
        label={t('Username')}
        name={['payload', 'username']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t('Password')}
        name={['payload', 'password']}
        rules={[{ required: true }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label={t('From Email')}
        name={['payload', 'from']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t('To Email')}
        name={['payload', 'to']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label={t('CC')} name={['payload', 'cc']}>
        <Input />
      </Form.Item>
      <Form.Item label={t('BCC')} name={['payload', 'bcc']}>
        <Input />
      </Form.Item>
    </>
  );
});
NotificationSMTP.displayName = 'NotificationSMTP';

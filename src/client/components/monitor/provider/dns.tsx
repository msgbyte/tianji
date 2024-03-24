import { Form, Input, InputNumber, Select } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';
import { hostnameValidator, portValidator } from '../../../utils/validator';
import { useTranslation } from '@i18next-toolkit/react';

const rrtypeList = [
  'A',
  'AAAA',
  'CAA',
  'CNAME',
  'MX',
  'NS',
  'RTP',
  'SOA',
  'SRV',
  'TXT',
];

export const MonitorDNS: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Host')}
        name={['payload', 'hostname']}
        rules={[
          { required: true },
          {
            validator: hostnameValidator,
          },
        ]}
      >
        <Input placeholder="example.com or 1.2.3.4" />
      </Form.Item>
      <Form.Item
        label={t('Resolver Server')}
        name={['payload', 'resolverServer']}
        initialValue="1.1.1.1"
        rules={[
          { required: true },
          {
            validator: hostnameValidator,
          },
        ]}
      >
        <Input placeholder="example.com or 1.2.3.4" />
      </Form.Item>
      <Form.Item
        label={t('Resolver Port')}
        name={['payload', 'resolverPort']}
        initialValue={53}
        rules={[
          { required: true },
          {
            validator: portValidator,
          },
        ]}
      >
        <InputNumber min={1} max={65535} />
      </Form.Item>
      <Form.Item
        label={t('Resouce Record Type')}
        name={['payload', 'rrtype']}
        initialValue="CNAME"
        rules={[
          { required: true },
          {
            enum: rrtypeList,
          },
        ]}
      >
        <Select>
          {rrtypeList.map((type) => (
            <Select.Option key={type} value={type}>
              {type}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
});
MonitorDNS.displayName = 'MonitorDNS';

export const dnsProvider: MonitorProvider = {
  label: 'DNS',
  name: 'dns',
  link: (info) => (
    <span>
      <b className="mr-1">[{info.payload.rrtype}]</b>
      {info.payload.hostname}
    </span>
  ),
  form: MonitorDNS,
};

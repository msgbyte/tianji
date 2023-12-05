import { Form, Input } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';
import { z } from 'zod';
import { hostnameRegex } from '../../../../shared';

export const MonitorPing: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item
        label="Host"
        name={['payload', 'hostname']}
        rules={[
          { required: true },
          {
            validator(rule, value, callback) {
              try {
                z.union([
                  z.string().ip(),
                  z.string().regex(hostnameRegex),
                ]).parse(value);
                callback();
              } catch (err) {
                callback('Not valid host, it should be ip or hostname');
              }
            },
          },
        ]}
      >
        <Input placeholder="example.com or 1.2.3.4" />
      </Form.Item>
    </>
  );
});
MonitorPing.displayName = 'MonitorPing';

export const pingProvider: MonitorProvider = {
  label: 'Ping',
  name: 'ping',
  link: (info) => String(info.payload.hostname),
  form: MonitorPing,
};

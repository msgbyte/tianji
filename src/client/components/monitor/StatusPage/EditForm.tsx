import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { slugRegex } from '../../../../shared';
import { z } from 'zod';

const { Text } = Typography;

interface Values {
  title: string;
  slug: string;
}

interface MonitorStatusPageEditFormProps {
  isLoading?: boolean;
  onFinish: (values: Values) => void;
}

export const MonitorStatusPageEditForm: React.FC<MonitorStatusPageEditFormProps> =
  React.memo((props) => {
    return (
      <div>
        <Form<Values> layout="vertical" onFinish={props.onFinish}>
          <Form.Item
            label="Title"
            name="title"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Slug"
            name="slug"
            extra={
              <div className="pt-2">
                <div>
                  Accept characters: <Text code>a-z</Text> <Text code>0-9</Text>{' '}
                  <Text code>-</Text>
                </div>
                <div>
                  No consecutive dashes <Text code>--</Text>
                </div>
              </div>
            }
            rules={[
              {
                required: true,
              },
              {
                validator(rule, value, callback) {
                  try {
                    z.string().regex(slugRegex).parse(value);
                    callback();
                  } catch (err) {
                    callback('Not valid slug');
                  }
                },
              },
            ]}
          >
            <Input addonBefore={`${window.origin}/status/`} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={props.isLoading}>
            Next
          </Button>
        </Form>
      </div>
    );
  });
MonitorStatusPageEditForm.displayName = 'MonitorStatusPageEditForm';

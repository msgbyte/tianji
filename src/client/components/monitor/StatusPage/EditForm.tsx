import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { slugRegex } from '../../../../shared';
import { z } from 'zod';

const { Text } = Typography;

export interface MonitorStatusPageEditFormValues {
  title: string;
  slug: string;
}

interface MonitorStatusPageEditFormProps {
  isLoading?: boolean;
  initialValues?: Partial<MonitorStatusPageEditFormValues>;
  onFinish: (values: MonitorStatusPageEditFormValues) => void;
  onCancel?: () => void;
  saveButtonLabel?: string;
}

export const MonitorStatusPageEditForm: React.FC<MonitorStatusPageEditFormProps> =
  React.memo((props) => {
    return (
      <div>
        <Form<MonitorStatusPageEditFormValues>
          layout="vertical"
          initialValues={props.initialValues}
          onFinish={props.onFinish}
        >
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

          <div className="flex gap-4">
            <Button type="primary" htmlType="submit" loading={props.isLoading}>
              {props.saveButtonLabel ?? 'Save'}
            </Button>

            {props.onCancel && (
              <Button htmlType="button" onClick={props.onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </Form>
      </div>
    );
  });
MonitorStatusPageEditForm.displayName = 'MonitorStatusPageEditForm';

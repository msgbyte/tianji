import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { slugRegex } from '../../../../shared';
import { z } from 'zod';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { MonitorPicker } from '../MonitorPicker';

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
          onValuesChange={console.log}
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

          <Form.List name="monitorList">
            {(fields, { add, remove }, { errors }) => {
              return (
                <>
                  <Form.Item label="Monitors">
                    {fields.map((field, index) => (
                      <div key={field.key} className="flex gap-2 items-start">
                        <Form.Item
                          name={[field.name, 'id']}
                          className="flex-1"
                          rules={[
                            {
                              required: true,
                              message: 'Please select monitor',
                            },
                          ]}
                        >
                          <MonitorPicker />
                        </Form.Item>

                        <MinusCircleOutlined
                          className="text-lg mt-1.5"
                          onClick={() => remove(field.name)}
                        />
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      onClick={() => add()}
                      style={{ width: '60%' }}
                      icon={<PlusOutlined />}
                    >
                      Add Monitor
                    </Button>

                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              );
            }}
          </Form.List>

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

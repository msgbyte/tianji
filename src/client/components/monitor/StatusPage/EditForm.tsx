import { Button, Divider, Form, Input, Switch, Typography } from 'antd';
import React from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { MonitorPicker } from '../MonitorPicker';
import { urlSlugValidator } from '../../../utils/validator';

const { Text } = Typography;

export interface MonitorStatusPageEditFormValues {
  title: string;
  slug: string;
  monitorList: PrismaJson.MonitorStatusPageList;
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
                validator: urlSlugValidator,
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
                    <div className="flex flex-col gap-2 mb-2">
                      {fields.map((field, index) => (
                        // monitor item
                        <>
                          {index !== 0 && <Divider className="my-0.5" />}

                          <div key={field.key} className="flex flex-col gap-1">
                            <Form.Item
                              name={[field.name, 'id']}
                              rules={[
                                {
                                  required: true,
                                  message: 'Please select monitor',
                                },
                              ]}
                              noStyle={true}
                            >
                              <MonitorPicker />
                            </Form.Item>

                            <div className="flex item-center">
                              <div className="flex-1">
                                <Form.Item
                                  name={[field.name, 'showCurrent']}
                                  valuePropName="checked"
                                  noStyle={true}
                                >
                                  <Switch size="small" />
                                </Form.Item>

                                <span className="text-sm align-middle ml-1">
                                  Show Current Response
                                </span>
                              </div>

                              <MinusCircleOutlined
                                className="text-lg mt-1.5"
                                onClick={() => remove(field.name)}
                              />
                            </div>
                          </div>
                        </>
                      ))}
                    </div>

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

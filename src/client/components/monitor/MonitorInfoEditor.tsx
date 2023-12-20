import React, { useMemo } from 'react';
import type { Monitor } from '@prisma/client';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import { getMonitorProvider, monitorProviders } from './provider';
import { useEvent } from '../../hooks/useEvent';
import { NotificationPicker } from '../notification/NotificationPicker';

export type MonitorInfoEditorValues = Omit<
  Monitor,
  'id' | 'workspaceId' | 'createdAt'
> & {
  id?: string;
  payload: Record<string, any>;
  notificationIds?: string[];
};

const defaultValues: Omit<MonitorInfoEditorValues, 'payload'> = {
  name: 'New Monitor',
  type: monitorProviders[0].name,
  active: true,
  interval: 60,
};

interface MonitorInfoEditorProps {
  initialValues?: MonitorInfoEditorValues;
  onSave: (value: MonitorInfoEditorValues) => void;
}
export const MonitorInfoEditor: React.FC<MonitorInfoEditorProps> = React.memo(
  (props) => {
    const [form] = Form.useForm();
    const typeValue = Form.useWatch('type', form);
    const initialValues = props.initialValues ?? defaultValues;
    const isEdit = Boolean(initialValues.id);

    const provider = useMemo(() => {
      return getMonitorProvider(typeValue);
    }, [typeValue]);

    const formEl = useMemo(() => {
      if (!provider) {
        return null;
      }

      const Component = provider.form;

      return <Component />;
    }, [provider]);

    const handleSubmit = useEvent((values) => {
      props.onSave({
        ...values,
        active: true,
      });
    });

    return (
      <div className="px-4">
        <Form
          preserve={false}
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleSubmit}
        >
          <Form.Item hidden name="id" />

          <Form.Item label="Monitor Type" name="type">
            <Select disabled={isEdit}>
              {monitorProviders.map((m) => (
                <Select.Option key={m.name} value={m.name}>
                  {m.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Check Interval(s)"
            name="interval"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={provider?.minInterval ?? 5}
              max={10000}
              step={10}
            />
          </Form.Item>

          {formEl}

          <Form.Item label="Notification" name="notificationIds">
            <NotificationPicker allowClear={true} mode="multiple" />
          </Form.Item>

          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </Form>
      </div>
    );
  }
);
MonitorInfoEditor.displayName = 'MonitorInfoEditor';

import React, { useMemo } from 'react';
import type { Monitor } from '../../../server/types/prisma';
import { Button, Form, Input, InputNumber, Select, Switch } from 'antd';
import { getMonitorProvider, monitorProviders } from './provider';
import { useEventWithLoading } from '../../hooks/useEvent';
import { NotificationPicker } from '../notification/NotificationPicker';
import { useTranslation } from '@i18next-toolkit/react';

export type MonitorInfoEditorValues = Omit<
  Monitor,
  'id' | 'workspaceId' | 'createdAt' | 'updatedAt'
> & {
  id?: string;
  payload: Record<string, any>;
  trendingMode: boolean;
  notificationIds?: string[];
};

const defaultValues: Omit<MonitorInfoEditorValues, 'payload'> = {
  name: 'New Monitor',
  type: monitorProviders[0].name,
  active: true,
  interval: 60,
  maxRetries: 0,
  trendingMode: false,
};

interface MonitorInfoEditorProps {
  initialValues?: MonitorInfoEditorValues;
  onSave: (value: MonitorInfoEditorValues) => Promise<void>;
}
export const MonitorInfoEditor: React.FC<MonitorInfoEditorProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
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

    const [handleSubmit, isLoading] = useEventWithLoading(async (values) => {
      await props.onSave({
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

          <Form.Item label={t('Monitor Type')} name="type">
            <Select disabled={isEdit}>
              {monitorProviders.map((m) => (
                <Select.Option key={m.name} value={m.name}>
                  {m.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={t('Name')} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            label={t('Check Interval(s)')}
            name="interval"
            rules={[{ required: true }]}
          >
            <InputNumber
              min={provider?.minInterval ?? 5}
              max={10000}
              step={10}
            />
          </Form.Item>

          <Form.Item
            label={t('Max Retries')}
            name="maxRetries"
            tooltip={t(
              'Maximum retries before the service is marked as down and a notification is sent'
            )}
          >
            <InputNumber min={0} max={10} defaultValue={0} />
          </Form.Item>

          {formEl}

          <Form.Item
            label={t('Trending Mode')}
            name="trendingMode"
            valuePropName="checked"
            tooltip={t('Y Axis will not start from zero')}
          >
            <Switch />
          </Form.Item>

          <Form.Item label={t('Notification')} name="notificationIds">
            <NotificationPicker allowClear={true} mode="multiple" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEdit ? t('Save') : t('Create')}
          </Button>
        </Form>
      </div>
    );
  }
);
MonitorInfoEditor.displayName = 'MonitorInfoEditor';

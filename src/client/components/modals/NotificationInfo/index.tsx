import {
  Button,
  Form,
  FormProps,
  Input,
  Modal,
  ModalProps,
  Select,
} from 'antd';
import React, { useMemo } from 'react';
import { useEvent } from '../../../hooks/useEvent';
import { notificationStrategies } from './strategies';

export interface NotificationFormValues {
  id?: string;
  name: string;
  type: string;
  payload: Record<string, any>;
}

const defaultValues: Omit<NotificationFormValues, 'payload'> = {
  name: 'New Notification',
  type: notificationStrategies[0].name,
};

interface NotificationInfoModalProps
  extends Pick<ModalProps, 'open' | 'onCancel'>,
    Pick<FormProps, 'initialValues'> {
  onSubmit: (values: NotificationFormValues) => void;
}
export const NotificationInfoModal: React.FC<NotificationInfoModalProps> =
  React.memo((props) => {
    const [form] = Form.useForm();
    const typeValue = Form.useWatch('type', form);

    const formEl = useMemo(() => {
      const strategy = notificationStrategies.find((s) => s.name === typeValue);

      if (!strategy) {
        return null;
      }

      const Component = strategy.form;

      return <Component />;
    }, [typeValue]);

    const handleSave = useEvent(async () => {
      await form.validateFields();
      const values = form.getFieldsValue();
      const { id, name, type, payload } = values;

      props.onSubmit({
        id,
        name,
        type,
        payload,
      });
    });

    const handleTest = useEvent(async () => {
      await form.validateFields();
      const values = form.getFieldsValue();
      const { name, type, payload } = values;

      console.log('TODO', { name, type, payload });
    });

    return (
      <Modal
        title="Notification"
        destroyOnClose={true}
        maskClosable={false}
        centered={true}
        open={props.open}
        onCancel={props.onCancel}
        footer={
          <div>
            <Button onClick={handleTest}>Test</Button>
            <Button type="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        }
      >
        <div className="overflow-y-auto max-h-[80vh]">
          <Form
            preserve={false}
            form={form}
            layout="vertical"
            initialValues={props.initialValues ?? defaultValues}
          >
            <Form.Item hidden name="id" />
            <Form.Item label="Notification Type" name="type">
              <Select>
                {notificationStrategies.map((s) => (
                  <Select.Option key={s.name} value={s.name}>
                    {s.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Display Name" name="name">
              <Input />
            </Form.Item>

            {formEl}
          </Form>
        </div>
      </Modal>
    );
  });
NotificationInfoModal.displayName = 'NotificationInfoModal';

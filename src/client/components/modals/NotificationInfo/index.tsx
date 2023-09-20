import { Form, Input, Modal, ModalProps, Select } from 'antd';
import React, { useMemo, useState } from 'react';
import { notificationStrategies } from './strategies';

interface NotificationInfoModalProps
  extends Pick<ModalProps, 'open' | 'onOk' | 'onCancel'> {}
export const NotificationInfoModal: React.FC<NotificationInfoModalProps> =
  React.memo((props) => {
    const [notificationType, setNotificationType] = useState(
      notificationStrategies[0].name
    );

    const form = useMemo(() => {
      const strategy = notificationStrategies.find(
        (s) => s.name === notificationType
      );

      if (!strategy) {
        return null;
      }

      const Component = strategy.form;

      return <Component />;
    }, [notificationType]);

    return (
      <Modal
        title="Notification"
        open={props.open}
        onOk={props.onOk}
        onCancel={props.onCancel}
      >
        <Form layout="vertical">
          <Form.Item label="Notification Type">
            <Select
              value={notificationType}
              onChange={(val) => setNotificationType(val)}
            >
              {notificationStrategies.map((s) => (
                <Select.Option value={s.name}>{s.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Display Name" name="name">
            <Input />
          </Form.Item>

          {form}
        </Form>
      </Modal>
    );
  });
NotificationInfoModal.displayName = 'NotificationInfoModal';

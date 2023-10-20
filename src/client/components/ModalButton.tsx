import { Button, ButtonProps, Modal, ModalProps } from 'antd';
import React, { useState } from 'react';

interface ModalButtonProps {
  buttonProps: Omit<ButtonProps, 'onClick'>;
  modalProps: Omit<ModalProps, 'open' | 'onCancel'>;
}
export const ModalButton: React.FC<ModalButtonProps> = React.memo((props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        {...props.buttonProps}
        onClick={() => setIsOpen((state) => !state)}
      />
      <Modal
        onOk={() => setIsOpen(false)}
        {...props.modalProps}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
});
ModalButton.displayName = 'ModalButton';

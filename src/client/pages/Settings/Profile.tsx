import { Button, Card, Form, Input, Modal, Typography } from 'antd';
import React, { useState } from 'react';
import { useUserStore } from '../../store/user';
import { PageHeader } from '../../components/PageHeader';
import {
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '../../api/trpc';
import { useLogout } from '../../api/model/user';

export const Profile: React.FC = React.memo(() => {
  const userInfo = useUserStore((state) => state.info);
  const [openChangePassword, setOpenChangePassword] = useState(false);

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });

  const logout = useLogout();

  return (
    <div>
      <PageHeader title="Profile" />

      <Card>
        <Form layout="vertical">
          <Form.Item label="User Id">
            <Typography.Text copyable={true} code={true}>
              {userInfo?.id}
            </Typography.Text>
          </Form.Item>
          <Form.Item label="Current Workspace Id">
            <Typography.Text copyable={true} code={true}>
              {userInfo?.currentWorkspace?.id}
            </Typography.Text>
          </Form.Item>
          <Form.Item label="Password">
            <Button danger={true} onClick={() => setOpenChangePassword(true)}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        open={openChangePassword}
        footer={null}
        maskClosable={false}
        onCancel={() => setOpenChangePassword(false)}
        destroyOnClose={true}
      >
        <Form
          layout="vertical"
          onFinish={async (values) => {
            const { oldPassword, newPassword } = values;
            await changePasswordMutation.mutateAsync({
              oldPassword,
              newPassword,
            });
            logout();
          }}
        >
          <Form.Item
            label="Old Password"
            name="oldPassword"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Old Password"
            name="newPasswordRepeat"
            rules={[
              { required: true },
              (form) => ({
                validator(rule, value) {
                  if (!value || form.getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject('The two passwords are not consistent');
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item className="text-right">
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordMutation.isLoading}
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
Profile.displayName = 'Profile';

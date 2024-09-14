import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, Form, Input, Modal, Popconfirm, Typography } from 'antd';
import { trpc, defaultSuccessHandler, defaultErrorHandler } from '@/api/trpc';
import { useUserStore } from '@/store/user';
import { useState } from 'react';
import { CommonHeader } from '@/components/CommonHeader';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/api/authjs/useAuth';

export const Route = createFileRoute('/settings/profile')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const userInfo = useUserStore((state) => state.info);
  const [openChangePassword, setOpenChangePassword] = useState(false);

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });

  const { logout } = useAuth();

  return (
    <CommonWrapper header={<CommonHeader title={t('Profile')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <div>
          <Card>
            <Form layout="vertical">
              <Form.Item label={t('Current Workspace Id')}>
                <Typography.Text copyable={true} code={true}>
                  {userInfo?.currentWorkspaceId}
                </Typography.Text>
              </Form.Item>
              <Form.Item label={t('User Id')}>
                <Typography.Text copyable={true} code={true}>
                  {userInfo?.id}
                </Typography.Text>
              </Form.Item>
              <Form.Item label={t('Password')}>
                <Button
                  variant="destructive"
                  onClick={() => setOpenChangePassword(true)}
                >
                  {t('Change Password')}
                </Button>
              </Form.Item>
            </Form>

            <Separator className="mb-4" />

            <Popconfirm
              title={t('Confirm to logout')}
              onConfirm={() => logout()}
            >
              <Button variant="destructive">{t('Logout')}</Button>
            </Popconfirm>
          </Card>

          <Modal
            open={openChangePassword}
            title={t('Change password')}
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
                label={t('Old Password')}
                name="oldPassword"
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label={t('New Password')}
                name="newPassword"
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                label={t('New Password Repeat')}
                name="newPasswordRepeat"
                rules={[
                  { required: true },
                  (form) => ({
                    validator(rule, value) {
                      if (
                        !value ||
                        form.getFieldValue('newPassword') === value
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        t('The two passwords are not consistent')
                      );
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item className="text-right">
                <Button
                  type="submit"
                  loading={changePasswordMutation.isLoading}
                >
                  {t('Submit')}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}

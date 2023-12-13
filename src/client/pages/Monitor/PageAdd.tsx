import React from 'react';
import { useNavigate } from 'react-router';
import { useCurrentWorkspaceId } from '../../store/user';
import { trpc } from '../../api/trpc';
import { Button, Form, Input, Typography } from 'antd';
import { useEvent } from '../../hooks/useEvent';
import { z } from 'zod';
import { slugRegex } from '../../../shared';

const { Text, Paragraph } = Typography;

interface Values {
  title: string;
  slug: string;
}

export const MonitorPageAdd: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId()!;
  const navigate = useNavigate();

  const createPageMutation = trpc.monitor.createPage.useMutation();
  const trpcUtils = trpc.useContext();

  const handleFinish = useEvent(async (values: Values) => {
    await createPageMutation.mutateAsync({
      workspaceId,
      title: values.title,
      slug: values.slug,
    });

    trpcUtils.monitor.getAllPages.refetch();

    navigate('/monitor/pages');
  });

  return (
    <div className="px-8 py-4">
      <Form<Values> layout="vertical" onFinish={handleFinish}>
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
        <Button
          type="primary"
          htmlType="submit"
          loading={createPageMutation.isLoading}
        >
          Next
        </Button>
      </Form>
    </div>
  );
});
MonitorPageAdd.displayName = 'MonitorPageAdd';

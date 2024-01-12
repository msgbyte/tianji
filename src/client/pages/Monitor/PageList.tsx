import React from 'react';
import { useNavigate } from 'react-router';
import { useCurrentWorkspaceId } from '../../store/user';
import { trpc } from '../../api/trpc';
import { Button, Card, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useEvent } from '../../hooks/useEvent';

export const MonitorPageList: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const { data: pages = [], refetch } = trpc.monitor.getAllPages.useQuery({
    workspaceId,
  });
  const deletePageMutation = trpc.monitor.deletePage.useMutation();

  const handleDeletePage = useEvent(async (monitorId: string) => {
    await deletePageMutation.mutateAsync({
      workspaceId,
      id: monitorId,
    });

    refetch();
  });

  return (
    <div className="px-8 py-4">
      <Button type="primary" onClick={() => navigate('/monitor/pages/add')}>
        New page
      </Button>

      <div className="mt-4 flex flex-col gap-2">
        {pages.map((p) => (
          <Card bodyStyle={{ padding: 12 }}>
            <div className="flex">
              <div className="flex-1">{p.title}</div>
              <div className="flex gap-2">
                <Popconfirm
                  title="Did you sure delete this page?"
                  onConfirm={() => handleDeletePage(p.id)}
                  okButtonProps={{
                    danger: true,
                    loading: deletePageMutation.isLoading,
                  }}
                >
                  <Button icon={<DeleteOutlined />} />
                </Popconfirm>

                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/status/${p.slug}?edit=1`)}
                />

                <Button
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/status/${p.slug}`)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});
MonitorPageList.displayName = 'MonitorPageList';

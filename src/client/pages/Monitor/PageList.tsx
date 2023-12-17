import React from 'react';
import { useNavigate } from 'react-router';
import { useCurrentWorkspaceId } from '../../store/user';
import { trpc } from '../../api/trpc';
import { Button, Card } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';

export const MonitorPageList: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId()!;
  const { data: pages = [] } = trpc.monitor.getAllPages.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();

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
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/status/${p.slug}`)}
                />
                <Button
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/status/${p.slug}?edit=1`)}
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

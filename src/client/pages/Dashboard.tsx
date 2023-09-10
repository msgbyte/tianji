import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { WebsiteOverview } from '../components/WebsiteOverview';
import { useCurrentWorkspaceId } from '../store/user';
import { Loading } from '../components/Loading';

export const Dashboard: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();

  if (!workspaceId) {
    return <Loading />;
  }

  return (
    <div>
      <div className="h-24 flex items-center">
        <div className="text-2xl flex-1">Dashboard</div>
        <div>
          <Button icon={<EditOutlined />} size="large">
            Edit
          </Button>
        </div>
      </div>
      <div>
        <WebsiteOverview workspaceId={workspaceId} />
      </div>
    </div>
  );
});
Dashboard.displayName = 'Dashboard';

import React, { Fragment } from 'react';
import { ArrowRightOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Divider } from 'antd';
import { WebsiteOverview } from '../components/website/WebsiteOverview';
import { useCurrentWorkspaceId } from '../store/user';
import { Loading } from '../components/Loading';
import { useWorspaceWebsites } from '../api/model/website';
import { NoWorkspaceTip } from '../components/NoWorkspaceTip';
import { useNavigate } from 'react-router';

export const Dashboard: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId()!;
  const { isLoading, websites } = useWorspaceWebsites(workspaceId);
  const navigate = useNavigate();

  if (!workspaceId) {
    return <NoWorkspaceTip />;
  }

  if (isLoading) {
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
        {websites.map((website, i) => (
          <Fragment key={website.id}>
            {i !== 0 && <Divider />}

            <WebsiteOverview
              website={website}
              actions={
                <>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      navigate(`/website/${website.id}`);
                    }}
                  >
                    View Details <ArrowRightOutlined />
                  </Button>
                </>
              }
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
});
Dashboard.displayName = 'Dashboard';

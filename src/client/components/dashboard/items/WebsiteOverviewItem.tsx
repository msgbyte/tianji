import React from 'react';
import { trpc } from '../../../api/trpc';
import { useCurrentWorkspaceId } from '../../../store/user';
import { Loading } from '../../Loading';
import { NotFoundTip } from '../../NotFoundTip';
import { WebsiteOverview } from '../../website/WebsiteOverview';
import { Button } from 'antd';
import { useNavigate } from 'react-router';
import { ArrowRightOutlined } from '@ant-design/icons';

export const WebsiteOverviewItem: React.FC<{
  websiteId: string;
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();

  const { data: websiteInfo, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId: props.websiteId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!websiteInfo) {
    return <NotFoundTip />;
  }

  return (
    <WebsiteOverview
      website={websiteInfo}
      actions={
        <>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              navigate(`/website/${websiteInfo.id}`);
            }}
          >
            View Details <ArrowRightOutlined />
          </Button>
        </>
      }
    />
  );
});
WebsiteOverviewItem.displayName = 'WebsiteOverviewItem';

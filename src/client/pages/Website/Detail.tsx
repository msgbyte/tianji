import { Divider } from 'antd';
import React from 'react';
import { useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import { NotFoundTip } from '../../components/NotFoundTip';
import { WebsiteOverview } from '../../components/WebsiteOverview';
import { useCurrentWorkspaceId } from '../../store/user';

export const WebsiteDetail: React.FC = React.memo(() => {
  const { websiteId } = useParams();
  const workspaceId = useCurrentWorkspaceId();
  const { data: website, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId: websiteId!,
  });

  if (!websiteId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!website) {
    return <NotFoundTip />;
  }

  return (
    <div className="py-6">
      <div>
        <WebsiteOverview website={website} />
      </div>

      <Divider />

      <div className="flex">
        <div className="flex-1">left</div>
        <Divider type="vertical" />
        <div className="flex-1">right</div>
      </div>
    </div>
  );
});
WebsiteDetail.displayName = 'WebsiteDetail';

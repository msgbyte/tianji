import { Card, Divider } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import { NotFoundTip } from '../../components/NotFoundTip';
import { PagesTable } from '../../components/website/PagesTable';
import { WebsiteOverview } from '../../components/website/WebsiteOverview';
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
      <Card>
        <Card.Grid hoverable={false} className="!w-full">
          <WebsiteOverview website={website} />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2">
          <PagesTable
            websiteId={websiteId}
            startAt={dayjs().subtract(1, 'day').unix() * 1000}
            endAt={dayjs().unix() * 1000}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2">
          right
        </Card.Grid>
      </Card>
    </div>
  );
});
WebsiteDetail.displayName = 'WebsiteDetail';

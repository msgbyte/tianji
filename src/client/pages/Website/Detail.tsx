import { Card, Divider } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import { NotFoundTip } from '../../components/NotFoundTip';
import { MetricsTable } from '../../components/website/MetricsTable';
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

  const startAt = dayjs().subtract(1, 'day').unix() * 1000;
  const endAt = dayjs().unix() * 1000;

  return (
    <div className="py-6">
      <Card>
        <Card.Grid hoverable={false} className="!w-full">
          <WebsiteOverview website={website} />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="url"
            title={['Pages', 'Views']}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/2 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="referrer"
            title={['Referrers', 'Views']}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="browser"
            title={['Browser', 'Visitors']}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="os"
            title={['OS', 'Visitors']}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="device"
            title={['Devices', 'Visitors']}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-2/3 min-h-[470px]">
          {/* Map */}
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="country"
            title={['Countries', 'Visitors']}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-1/3 min-h-[470px]">
          <MetricsTable
            websiteId={websiteId}
            type="event"
            title={['Events', 'Actions']}
            startAt={startAt}
            endAt={endAt}
          />
        </Card.Grid>
        <Card.Grid hoverable={false} className="!w-2/3 min-h-[470px]">
          {/* Events */}
        </Card.Grid>
      </Card>
    </div>
  );
});
WebsiteDetail.displayName = 'WebsiteDetail';

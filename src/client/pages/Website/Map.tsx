import React from 'react';
import { useParams } from 'react-router';
import { trpc } from '../../api/trpc';
import { ErrorTip } from '../../components/ErrorTip';
import { Loading } from '../../components/Loading';
import { NotFoundTip } from '../../components/NotFoundTip';
import { useCurrentWorkspaceId } from '../../store/user';
import { WebsiteVisitorMap } from '../../components/website/WebsiteVisitorMap';
import { DateFilter } from '../../components/DateFilter';

export const WebsiteVisitorMapPage: React.FC = React.memo(() => {
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
      <div className="pb-2 flex justify-end">
        <DateFilter />
      </div>
      <WebsiteVisitorMap websiteId={websiteId} />
    </div>
  );
});
WebsiteVisitorMapPage.displayName = 'WebsiteVisitorMapPage';

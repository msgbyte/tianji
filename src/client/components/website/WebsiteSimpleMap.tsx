import React, { useMemo } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { SimpleWorldMap } from '../SimpleWorldMap';

interface WebsiteSimpleMapProps {
  websiteId: string;
  startAt: number;
  endAt: number;
}

export const WebsiteSimpleMap: React.FC<WebsiteSimpleMapProps> = React.memo(
  (props) => {
    const { websiteId, startAt, endAt } = props;
    const workspaceId = useCurrentWorkspaceId();

    const { data: metrics = [] } = trpc.website.metrics.useQuery({
      workspaceId,
      websiteId,
      type: 'country',
      startAt,
      endAt,
    });

    const data = useMemo(() => {
      return metrics.map((m) => ({
        country: m.x ?? '',
        visitors: m.y,
      }));
    }, [metrics]);

    return <SimpleWorldMap data={data} />;
  }
);
WebsiteSimpleMap.displayName = 'WebsiteSimpleMap';

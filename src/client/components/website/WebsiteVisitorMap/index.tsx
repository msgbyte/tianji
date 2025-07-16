import React from 'react';
import { trpc } from '../../../api/trpc';
import { useCurrentWorkspaceId } from '../../../store/user';
import { useGlobalRangeDate } from '../../../hooks/useGlobalRangeDate';
import loadable from '@loadable/component';
import { Loading } from '../../Loading';
import { useGlobalConfig } from '../../../hooks/useConfig';

const VisitorLeafletMap = loadable(() =>
  import('./VisitorLeafletMap').then((m) => m.VisitorLeafletMap)
);

const VisitorLarkMap = loadable(() =>
  import('./VisitorLarkMap').then((m) => m.VisitorLarkMap)
);

function useMapType() {
  const { amapToken, mapboxToken } = useGlobalConfig();

  if (mapboxToken) {
    return 'Mapbox';
  } else if (amapToken) {
    return 'Gaode';
  } else {
    return 'Leaflet';
  }
}

interface WebsiteVisitorMapProps {
  websiteId: string;
  fullScreen?: boolean;
}
export const WebsiteVisitorMap: React.FC<WebsiteVisitorMapProps> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { startDate, endDate } = useGlobalRangeDate();
    const startAt = startDate.valueOf();
    const endAt = endDate.valueOf();
    const { data } = trpc.website.geoStats.useQuery({
      workspaceId,
      websiteId: props.websiteId,
      startAt,
      endAt,
    });

    const mapType = useMapType();

    if (!data) {
      return <Loading />;
    }

    if (mapType === 'Mapbox' || mapType === 'Gaode') {
      return (
        <VisitorLarkMap
          mapType={mapType}
          data={data}
          fullScreen={props.fullScreen}
        />
      );
    }

    return <VisitorLeafletMap data={data} fullScreen={props.fullScreen} />;
  }
);
WebsiteVisitorMap.displayName = 'WebsiteVisitorMap';

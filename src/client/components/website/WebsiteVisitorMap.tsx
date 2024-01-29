import type { LarkMapProps, PointLayerProps } from '@antv/larkmap';
import { FullscreenControl, LarkMap, PointLayer } from '@antv/larkmap';
import React from 'react';
import { useSettingsStore } from '../../store/settings';
import { useGlobalConfig } from '../../hooks/useConfig';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { useGlobalRangeDate } from '../../hooks/useGlobalRangeDate';

const layerOptions: Omit<PointLayerProps, 'source'> = {
  autoFit: true,
  shape: 'circle',
  size: 5,
  blend: 'additive',
  color: {
    field: 'count',
    value: [
      'rgb(102,37,6)',
      'rgb(153,52,4)',
      'rgb(204,76,2)',
      'rgb(236,112,20)',
      'rgb(254,153,41)',
      'rgb(254,196,79)',
      'rgb(254,227,145)',
    ],
  },
};

function useMapConfig(mapType: 'Mapbox' | 'Gaode' = 'Mapbox'): LarkMapProps {
  const { amapToken, mapboxToken } = useGlobalConfig();
  const colorScheme = useSettingsStore((state) => state.colorScheme);

  const baseOption: LarkMapProps['mapOptions'] = {
    center: [120.210792, 30.246026],
    zoom: 0,
  };

  if (mapType === 'Gaode') {
    return {
      mapType: 'Gaode',
      mapOptions: {
        ...baseOption,
        style:
          colorScheme === 'light'
            ? 'amap://styles/light'
            : 'amap://styles/dark',
        token: amapToken,
      },
      logoVisible: false,
    };
  } else {
    return {
      mapType: 'Mapbox',
      mapOptions: {
        ...baseOption,
        style: colorScheme === 'light' ? 'light' : 'dark',
        token: mapboxToken,
      },
      logoVisible: false,
    };
  }
}

interface WebsiteVisitorMapProps {
  websiteId: string;
}
export const WebsiteVisitorMap: React.FC<WebsiteVisitorMapProps> = React.memo(
  (props) => {
    const config = useMapConfig();
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

    const source: PointLayerProps['source'] = {
      data: data ?? [],
      parser: { type: 'json', x: 'longitude', y: 'latitude' },
    };

    return (
      <LarkMap {...config} style={{ height: '60vh' }}>
        <FullscreenControl />
        <PointLayer {...layerOptions} source={source} />
      </LarkMap>
    );
  }
);
WebsiteVisitorMap.displayName = 'WebsiteVisitorMap';

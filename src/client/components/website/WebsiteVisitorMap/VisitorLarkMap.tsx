import {
  FullscreenControl,
  LarkMap,
  LarkMapProps,
  PointLayer,
  PointLayerProps,
} from '@antv/larkmap';
import React, { useMemo } from 'react';
import { AppRouterOutput } from '../../../api/trpc';
import { useGlobalConfig } from '../../../hooks/useConfig';
import { useSettingsStore } from '../../../store/settings';
import { mapCenter } from './utils';

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
    center: [mapCenter.lng, mapCenter.lat],
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

export const VisitorLarkMap: React.FC<{
  data: AppRouterOutput['website']['geoStats'];
  mapType: 'Mapbox' | 'Gaode';
  fullScreen?: boolean;
}> = React.memo((props) => {
  const config = useMapConfig(props.mapType);

  const source: PointLayerProps['source'] = {
    data: props.data ?? [],
    parser: { type: 'json', x: 'longitude', y: 'latitude' },
  };

  const size = useMemo(() => {
    if (props.data.length > 5000) {
      return 3;
    }

    return 5;
  }, [props.data.length]);

  return (
    <LarkMap {...config} style={{ height: props.fullScreen ? '100%' : '60vh' }}>
      <FullscreenControl />
      <PointLayer {...layerOptions} size={size} source={source} />
    </LarkMap>
  );
});
VisitorLarkMap.displayName = 'VisitorLarkMap';

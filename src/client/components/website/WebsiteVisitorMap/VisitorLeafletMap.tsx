import React, { useMemo } from 'react';
import { AppRouterOutput } from '../../../api/trpc';
import { MapContainer, CircleMarker, Popup, TileLayer } from 'react-leaflet';
import { mapCenter } from './utils';
import { useTranslation } from '@i18next-toolkit/react';
import { useTheme } from '@/store/settings';
import { cn } from '@/utils/style';
import 'leaflet/dist/leaflet.css';
import './VisitorLeafletMap.css';

export const UserDataPoint: React.FC<{
  pointRadius?: number;
  longitude: number;
  latitude: number;
  count: number;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const pointRadius = props.pointRadius ?? 5;

  return (
    <CircleMarker
      center={{
        lat: props.latitude,
        lng: props.longitude,
      }}
      radius={pointRadius}
      stroke={false}
      fill={true}
      fillColor="rgb(236,112,20)"
      fillOpacity={0.8}
    >
      <Popup>
        {t('{{num}} users', {
          num: props.count,
        })}
      </Popup>
    </CircleMarker>
  );
});
UserDataPoint.displayName = 'UserDataPoint';

export const VisitorLeafletMap: React.FC<{
  data: AppRouterOutput['website']['geoStats'];
  fullScreen?: boolean;
}> = React.memo((props) => {
  const theme = useTheme();
  const pointRadius = useMemo(() => {
    if (props.data.length > 20000) {
      return 1;
    }

    if (props.data.length > 5000) {
      return 2;
    }

    if (props.data.length > 1000) {
      return 3;
    }

    return 5;
  }, [props.data.length]);

  return (
    <MapContainer
      className={cn('w-full', props.fullScreen ? 'h-full' : 'h-[60vh]')}
      center={mapCenter}
      zoom={2}
      minZoom={2}
      maxZoom={10}
      scrollWheelZoom={true}
    >
      {/* <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> */}

      {theme === 'light' ? (
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      ) : (
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      )}

      {props.data.map((item) => (
        <UserDataPoint
          key={`${item.longitude},${item.latitude}`}
          pointRadius={pointRadius}
          {...item}
        />
      ))}
    </MapContainer>
  );
});
VisitorLeafletMap.displayName = 'VisitorLeafletMap';

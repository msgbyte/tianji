import React from 'react';
import { AppRouterOutput } from '../../../api/trpc';
import {
  MapContainer,
  CircleMarker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { mapCenter } from './utils';
import 'leaflet/dist/leaflet.css';
import './VisitorLeafletMap.css';

export const UserDataPoint: React.FC<{
  longitude: number;
  latitude: number;
  count: number;
}> = React.memo((props) => {
  const map = useMap();

  return (
    <CircleMarker
      center={{
        lat: props.latitude,
        lng: props.longitude,
      }}
      radius={5}
      stroke={false}
      fill={true}
      fillColor="rgb(236,112,20)"
      fillOpacity={0.8}
    >
      <Popup>{props.count} users</Popup>
    </CircleMarker>
  );
});
UserDataPoint.displayName = 'UserDataPoint';

export const VisitorLeafletMap: React.FC<{
  data: AppRouterOutput['website']['geoStats'];
}> = React.memo((props) => {
  return (
    <MapContainer
      className="w-full h-[60vh]"
      center={mapCenter}
      zoom={2}
      minZoom={2}
      maxZoom={10}
      scrollWheelZoom={true}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {props.data.map((item) => (
        <UserDataPoint key={`${item.longitude},${item.latitude}`} {...item} />
      ))}
    </MapContainer>
  );
});
VisitorLeafletMap.displayName = 'VisitorLeafletMap';

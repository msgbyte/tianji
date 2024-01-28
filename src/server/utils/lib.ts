import path from 'path';

export const libraryPath = {
  installScript: path.resolve(process.cwd(), '../../scripts/install.sh'),
  geoPath: path.resolve(process.cwd(), '../../geo/GeoLite2-City.mmdb'),
};

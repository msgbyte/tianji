import React, { useState, HTMLAttributes } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { colord } from 'colord';
import { cn } from '@/utils/style';
import { useTranslation } from '@i18next-toolkit/react';
import { ISO_COUNTRIES, useCountryMap } from '@/utils/country';
import { useTheme } from '@/store/settings';
import { HoverTooltip } from './HoverTooltip';

interface SimpleWorldMapProps extends HTMLAttributes<HTMLDivElement> {
  websiteId?: string;
  data?: { country: string; visitors: number }[];
  className?: string;
}

export const SimpleWorldMap: React.FC<SimpleWorldMapProps> = React.memo(
  (props) => {
    const { websiteId, data, className, ...otherProps } = props;
    const [tooltip, setTooltipPopup] = useState<string | null>(null);
    const { t } = useTranslation();
    const countryMap = useCountryMap();
    const theme = useTheme();

    const getFillColor = (code: string) => {
      if (code === 'AQ') {
        return;
      }

      const country = data?.find(({ country }) => country === code);

      if (!country) {
        return theme === 'light' ? '#f5f5f5' : '#323232';
      }

      return colord('#2680eb')
        [theme === 'light' ? 'lighten' : 'darken'](
          0.4 * (1.0 - country.visitors / 100)
        )
        .toHex();
    };

    const getOpacity = (code: string) => {
      return code === 'AQ' ? 0 : 1;
    };

    const handleHover = (code: string) => {
      if (code === 'AQ') {
        return;
      }

      const country = data?.find(({ country }) => country === code);
      setTooltipPopup(
        `${countryMap[code as keyof typeof countryMap] || t('Unknown')}: ${
          country?.visitors || 0
        } ${t('Visitors')}`
      );
    };

    return (
      <div
        {...otherProps}
        className={cn('relative overflow-hidden', className)}
        data-tip=""
        data-for="world-map-tooltip"
      >
        <ComposableMap projection="geoMercator">
          <ZoomableGroup zoom={0.8} minZoom={0.7} center={[0, 40]}>
            <Geographies geography="/datamaps.world.json">
              {({ geographies }) => {
                return geographies.map((geo) => {
                  const code = ISO_COUNTRIES[geo.id];

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFillColor(code)}
                      stroke={'#2680eb'}
                      opacity={getOpacity(code)}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: '#2680eb' },
                        pressed: { outline: 'none' },
                      }}
                      onMouseOver={() => handleHover(code)}
                      onMouseOut={() => setTooltipPopup(null)}
                    />
                  );
                });
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        {tooltip && <HoverTooltip>{tooltip}</HoverTooltip>}
      </div>
    );
  }
);

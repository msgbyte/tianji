import { useCountryMap } from '@/utils/country';
import { cn } from '@/utils/style';
import React from 'react';

interface CountryNameProps {
  className?: string;
  country: string | undefined;
}
export const CountryName: React.FC<CountryNameProps> = React.memo((props) => {
  const { country, className } = props;
  const countryMap = useCountryMap();

  return (
    <span className={cn(className)}>
      {countryMap[country as keyof typeof countryMap] || country}
    </span>
  );
});
CountryName.displayName = 'CountryName';

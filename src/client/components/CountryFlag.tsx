import React from 'react';

/**
 * image is from discord
 */
export const CountryFlag: React.FC<{ code: string }> = React.memo((props) => {
  return (
    <img
      className="w-[27px] h-[18px] ml-6"
      src={`/locales/${props.code}/flag.png`}
    />
  );
});
CountryFlag.displayName = 'CountryFlag';

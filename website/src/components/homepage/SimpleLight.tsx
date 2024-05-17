import clsx from 'clsx';
import React from 'react';

export const HomepageSimpleLight: React.FC<{
  className?: string;
  colorSet: 'blue' | 'cyan';
}> = React.memo((props) => {
  const background = {
    cyan:
      'radial-gradient(144.11% 103.06% at 50.00% 50.00%, rgba(27, 199, 237, 0.60) 0%, rgba(46, 180, 255, 0.06) 45.67%)',
    blue: 'radial-gradient(144.11% 103.06% at 50.00% 50.00%, rgba(27, 115, 237, 0.60) 0%, rgba(194, 46, 255, 0.06) 45.67%)',
  }[props.colorSet];

  return (
    <div
      className={clsx(
        'absolute -z-10 h-[1000px] w-[800px] blur-[150px]',
        props.className
      )}
      style={{
        background,
      }}
    ></div>
  );
});
HomepageSimpleLight.displayName = 'HomepageSimpleLight';

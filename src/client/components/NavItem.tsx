import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export const NavItem: React.FC<{
  to: string;
  label: string;
}> = React.memo((props) => {
  const location = useLocation();

  const isCurrent = location.pathname.startsWith(props.to);

  return (
    <Link to={props.to}>
      <div
        className={clsx('leading-[3.75rem] border-b-2', {
          'text-gray-950 border-blue-500': isCurrent,
          'text-gray-900 border-transparent hover:text-gray-950 hover:border-blue-500':
            !isCurrent,
        })}
      >
        {props.label}
      </div>
    </Link>
  );
});
NavItem.displayName = 'NavItem';

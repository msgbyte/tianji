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
        className={clsx('border-b-2 leading-[3.75rem]', {
          'border-blue-500 text-gray-950 dark:text-gray-200': isCurrent,
          'border-transparent text-gray-900 hover:border-blue-500 hover:text-gray-950 dark:text-gray-400':
            !isCurrent,
        })}
      >
        {props.label}
      </div>
    </Link>
  );
});
NavItem.displayName = 'NavItem';

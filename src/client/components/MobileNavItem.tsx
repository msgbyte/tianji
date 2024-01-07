import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export const MobileNavItem: React.FC<{
  to: string;
  label: string;
  onClick?: () => void;
}> = React.memo((props) => {
  const location = useLocation();

  const isCurrent = location.pathname.startsWith(props.to);

  return (
    <Link to={props.to}>
      <div
        className={clsx('rounded-md px-4 py-4', {
          'bg-neutral-100 text-neutral-900 dark:text-neutral-700': isCurrent,
          'text-neutral-900 dark:text-neutral-100': !isCurrent,
        })}
        onClick={props.onClick}
      >
        {props.label}
      </div>
    </Link>
  );
});
MobileNavItem.displayName = 'MobileNavItem';

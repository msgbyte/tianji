import clsx from 'clsx';
import React from 'react';

interface BlockCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
}
export const BlockCard: React.FC<BlockCardProps> = React.memo((props) => {
  const { icon, title, ...divProps } = props;
  return (
    <div
      {...divProps}
      className={clsx(
        'w-32 h-32 shadow rounded cursor-pointer hover:shadow-lg flex justify-center items-center bg-neutral-50 dark:bg-neutral-800',
        divProps.className
      )}
    >
      <div>
        <div className="text-4xl">{icon}</div>
        <div className="font-bold">{title}</div>
      </div>
    </div>
  );
});
BlockCard.displayName = 'BlockCard';

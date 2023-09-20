import React from 'react';

export const PageHeader: React.FC<{
  title: string;
  action?: React.ReactNode;
}> = React.memo((props) => {
  return (
    <div className="h-24 flex items-center">
      <div className="text-2xl flex-1">{props.title}</div>
      {props.action}
    </div>
  );
});
PageHeader.displayName = 'PageHeader';

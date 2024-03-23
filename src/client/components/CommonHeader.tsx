import React from 'react';

interface CommonHeaderProps {
  title: string;
  actions?: React.ReactNode;
}
export const CommonHeader: React.FC<CommonHeaderProps> = React.memo((props) => {
  return (
    <>
      <h1 className="text-xl font-bold">{props.title}</h1>

      {props.actions && <div className="ml-auto">{props.actions}</div>}
    </>
  );
});
CommonHeader.displayName = 'CommonHeader';

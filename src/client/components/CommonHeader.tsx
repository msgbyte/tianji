import React from 'react';
import { TipIcon } from './TipIcon';

interface CommonHeaderProps {
  title: string;
  desc?: React.ReactNode;
  actions?: React.ReactNode;
}
export const CommonHeader: React.FC<CommonHeaderProps> = React.memo((props) => {
  return (
    <>
      <h1 className="text-xl font-bold">{props.title}</h1>

      {props.desc && <TipIcon className="ml-1" content={props.desc} />}

      {props.actions && <div className="ml-auto">{props.actions}</div>}
    </>
  );
});
CommonHeader.displayName = 'CommonHeader';

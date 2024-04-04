import React from 'react';
import { TipIcon } from './TipIcon';

interface CommonHeaderProps {
  title: string;
  desc?: string;
  tip?: React.ReactNode;
  actions?: React.ReactNode;
}
export const CommonHeader: React.FC<CommonHeaderProps> = React.memo((props) => {
  return (
    <div className="flex w-full items-center">
      <div className="flex flex-1 items-center">
        <h1 className="text-xl font-bold">{props.title}</h1>

        {props.desc && (
          <span className="text-muted-foreground ml-2 self-end text-sm">
            {props.desc}
          </span>
        )}

        {props.tip && <TipIcon className="ml-1" content={props.tip} />}
      </div>

      {props.actions && <div className="ml-auto">{props.actions}</div>}
    </div>
  );
});
CommonHeader.displayName = 'CommonHeader';

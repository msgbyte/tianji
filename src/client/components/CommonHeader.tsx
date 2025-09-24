import React from 'react';
import { TipIcon } from './TipIcon';

interface CommonHeaderProps {
  title: React.ReactNode;
  desc?: string;
  tip?: React.ReactNode;
  actions?: React.ReactNode;
}
export const CommonHeader: React.FC<CommonHeaderProps> = React.memo((props) => {
  return (
    <div className="flex w-full items-center">
      <div className="flex flex-1 flex-shrink items-center overflow-hidden">
        <h1 className="flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-xl font-bold">
          {props.title}
        </h1>

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

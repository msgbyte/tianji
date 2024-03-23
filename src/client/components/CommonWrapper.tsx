import React from 'react';
import { Separator } from './ui/separator';

interface CommonWrapperProps extends React.PropsWithChildren {
  header?: React.ReactNode;
}
export const CommonWrapper: React.FC<CommonWrapperProps> = React.memo(
  (props) => {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-[52px] items-center px-4 py-2">
          {props.header}
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden">{props.children}</div>
      </div>
    );
  }
);
CommonWrapper.displayName = 'CommonWrapper';

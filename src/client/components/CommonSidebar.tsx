import React from 'react';
import { Separator } from './ui/separator';

interface CommonSidebarProps extends React.PropsWithChildren {
  header: React.ReactNode;
}
export const CommonSidebar: React.FC<CommonSidebarProps> = React.memo(
  (props) => {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center px-4 py-2 h-[52px]">
          {props.header}
        </div>

        <Separator />

        <div className="flex-1 overflow-hidden">{props.children}</div>
      </div>
    );
  }
);
CommonSidebar.displayName = 'CommonSidebar';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';

export const PageHeader: React.FC<{
  title: string;
  desc?: React.ReactNode;
  action?: React.ReactNode;
}> = React.memo((props) => {
  return (
    <div className="flex h-24 items-center">
      <div className="flex-1 text-2xl">
        {props.title}
        {props.desc && (
          <Tooltip title={props.desc}>
            <QuestionCircleOutlined className="ml-2 cursor-help text-sm" />
          </Tooltip>
        )}
      </div>

      {props.action}
    </div>
  );
});
PageHeader.displayName = 'PageHeader';

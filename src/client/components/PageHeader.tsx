import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';

export const PageHeader: React.FC<{
  title: string;
  desc?: React.ReactNode;
  action?: React.ReactNode;
}> = React.memo((props) => {
  return (
    <div className="h-24 flex items-center">
      <div className="text-2xl flex-1">
        {props.title}
        {props.desc && (
          <Tooltip title={props.desc}>
            <QuestionCircleOutlined className="text-sm ml-2 cursor-help" />
          </Tooltip>
        )}
      </div>

      {props.action}
    </div>
  );
});
PageHeader.displayName = 'PageHeader';

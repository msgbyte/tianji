import { useNavigate } from '@tanstack/react-router';
import { Empty } from 'antd';
import React from 'react';
import { Button } from './ui/button';
import { LuPlus } from 'react-icons/lu';
import { CommonWrapper } from './CommonWrapper';
import { CommonHeader } from './CommonHeader';

interface CommonPageEmptyProps {
  title?: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
}
export const CommonPageEmpty: React.FC<CommonPageEmptyProps> = React.memo(
  (props) => {
    const navigate = useNavigate();

    return (
      <CommonWrapper header={<CommonHeader title={props.title ?? ''} />}>
        <Empty
          className="pt-8"
          description={
            <div className="py-2">
              <div className="mb-1">{props.text}</div>
              <Button
                Icon={LuPlus}
                onClick={() =>
                  navigate({
                    to: props.buttonUrl,
                  })
                }
              >
                {props.buttonText}
              </Button>
            </div>
          }
        />
      </CommonWrapper>
    );
  }
);
CommonPageEmpty.displayName = 'CommonPageEmpty';

import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MetricsBlockProps {
  title: string;
  list: string[];
}
export const MetricsBlock: React.FC<MetricsBlockProps> = React.memo((props) => {
  const [title, setTitle] = useState(props.title);

  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <div className="border-muted hover:bg-muted w-full cursor-pointer rounded-lg border p-1">
            {title}
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <div>
            {props.list.map((item, i) => {
              return <div key={i}>{item}</div>;
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
MetricsBlock.displayName = 'MetricsBlock';

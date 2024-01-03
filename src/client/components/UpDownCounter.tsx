import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import React from 'react';

interface Props {
  up: string;
  down: string;
}
export const UpDownCounter: React.FC<Props> = React.memo((props) => {
  return (
    <div>
      <div>
        <CaretUpOutlined className="text-orange-500" />
        <span className="ml-1 text-xs">{props.up}</span>
      </div>
      <div>
        <CaretDownOutlined className="text-green-500" />
        <span className="ml-1 text-xs">{props.down}</span>
      </div>
    </div>
  );
});
UpDownCounter.displayName = 'UpDownCounter';

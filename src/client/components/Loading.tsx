import { LoadingOutlined } from '@ant-design/icons';
import React from 'react';

export const Loading: React.FC = React.memo(() => {
  return (
    <div>
      <LoadingOutlined />
    </div>
  );
});
Loading.displayName = 'Loading';

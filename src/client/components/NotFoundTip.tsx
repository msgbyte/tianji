import { Alert } from 'antd';
import React from 'react';

export const NotFoundTip: React.FC = React.memo(() => {
  return <Alert message="Not found" type="error" />;
});
NotFoundTip.displayName = 'NotFoundTip';

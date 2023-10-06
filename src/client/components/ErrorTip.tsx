import { Alert } from 'antd';
import React from 'react';

export const ErrorTip: React.FC = React.memo(() => {
  return <Alert message="An unexpected error has occurred" type="error" />;
});
ErrorTip.displayName = 'ErrorTip';

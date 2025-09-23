import { useTranslation } from '@i18next-toolkit/react';
import { Empty } from 'antd';
import React from 'react';

interface DataRenderProps {
  type: string;
  value: any;
}
export const DataRender: React.FC<DataRenderProps> = React.memo((props) => {
  const { t } = useTranslation();

  if (props.type === 'imageUrl') {
    if (props.value) {
      return <img src={props.value} />;
    } else {
      return <Empty description={t('No Image')} />;
    }
  }

  if (props.type === 'json') {
    if (typeof props.value === 'object') {
      return <pre>{JSON.stringify(props.value, null, 2)}</pre>;
    } else {
      return <span>{String(props.value)}</span>;
    }
  }

  return <span>{String(props.value)}</span>;
});
DataRender.displayName = 'DataRender';

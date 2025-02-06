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

  return <span>{String(props.value)}</span>;
});
DataRender.displayName = 'DataRender';

import { useTranslation } from '@i18next-toolkit/react';
import { Empty } from 'antd';
import React from 'react';
import { Button } from './ui/button';

interface DataRenderProps {
  className?: string;
  type: string;
  value: any;
}

const MAX_DISPLAY_LENGTH = 5000;

export const DataRender: React.FC<DataRenderProps> = React.memo((props) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (props.type === 'imageUrl') {
    if (props.value) {
      return <img className={props.className} src={props.value} />;
    } else {
      return <Empty className={props.className} description={t('No Image')} />;
    }
  }

  if (props.type === 'json') {
    const contentString =
      typeof props.value === 'object'
        ? JSON.stringify(props.value, null, 2)
        : String(props.value);

    const isLongContent = contentString.length > MAX_DISPLAY_LENGTH;
    const displayContent =
      isExpanded || !isLongContent
        ? contentString
        : contentString.substring(0, MAX_DISPLAY_LENGTH) + '...';
    const remainingLength = contentString.length - MAX_DISPLAY_LENGTH;

    const toggleButtons = isLongContent && (
      <>
        {!isExpanded && (
          <Button
            className="ml-2"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(true)}
          >
            {t('Expand')} (+{remainingLength.toLocaleString()} {t('characters')}
            )
          </Button>
        )}
        {isExpanded && (
          <Button
            className="ml-2"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            {t('Collapse')}
          </Button>
        )}
      </>
    );

    if (typeof props.value === 'object') {
      return (
        <>
          <pre className={props.className}>{displayContent}</pre>
          {toggleButtons}
        </>
      );
    } else {
      return (
        <>
          <span className={props.className}>{displayContent}</span>
          {toggleButtons}
        </>
      );
    }
  }

  return <span className={props.className}>{String(props.value)}</span>;
});
DataRender.displayName = 'DataRender';

import React, { PropsWithChildren } from 'react';
import ShowMoreText from 'react-show-more-text';
import { Button } from './ui/button';
import { useTranslation } from '@i18next-toolkit/react';

interface ReadMoreProps extends PropsWithChildren {
  className?: string;
}
export const ReadMore: React.FC<ReadMoreProps> = React.memo((props) => {
  const { t } = useTranslation();

  return (
    <div>
      <ShowMoreText
        className={props.className}
        lines={3}
        more={<Button variant="link">{t('Show more')}</Button>}
        less={<Button variant="link">{t('Show less')}</Button>}
        expanded={false}
        truncatedEndingComponent={'... '}
      >
        {props.children}
      </ShowMoreText>
    </div>
  );
});
ReadMore.displayName = 'ReadMore';

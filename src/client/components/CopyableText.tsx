import { cn } from '@/utils/style';
import React, { PropsWithChildren } from 'react';
import copy from 'copy-to-clipboard';
import { useEvent } from '@/hooks/useEvent';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';

interface CopyableTextProps extends PropsWithChildren {
  className?: string;
  text: string;
}
export const CopyableText: React.FC<CopyableTextProps> = React.memo((props) => {
  const { t } = useTranslation();
  const handleClick = useEvent(() => {
    copy(props.text);
    toast.success(t('Copied'));
  });

  return (
    <span
      className={cn(
        'cursor-pointer select-none rounded bg-white bg-opacity-10 px-2',
        'hover:bg-white hover:bg-opacity-20',
        props.className
      )}
      onClick={handleClick}
    >
      {props.children ?? props.text}
    </span>
  );
});
CopyableText.displayName = 'CopyableText';

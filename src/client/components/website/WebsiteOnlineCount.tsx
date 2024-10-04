import React from 'react';
import { trpc } from '../../api/trpc';
import { useTranslation } from '@i18next-toolkit/react';

export const WebsiteOnlineCount: React.FC<{
  workspaceId: string;
  websiteId: string;
}> = React.memo((props) => {
  const { t } = useTranslation();
  const { workspaceId, websiteId } = props;

  const { data: count } = trpc.website.onlineCount.useQuery({
    workspaceId,
    websiteId,
  });

  if (typeof count === 'number' && count > 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className='w-2.5" relative flex h-2.5'>
          <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-green-500" />
        </div>
        <span>
          {count} {t('current visitor')}
        </span>
      </div>
    );
  }

  return null;
});
WebsiteOnlineCount.displayName = 'WebsiteOnlineCount';

import { AppRouterOutput } from '@/api/trpc';
import React from 'react';
import { Badge } from '../ui/badge';
import dayjs from 'dayjs';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type FeedEventItemType = AppRouterOutput['feed']['events'][number];

export const FeedEventItem: React.FC<{ event: FeedEventItemType }> = React.memo(
  ({ event }) => {
    return (
      <div className="border-muted flex items-center rounded-lg border px-4 py-2">
        <div className="flex-1 gap-2">
          <div className="mb-2 flex gap-2">
            <div>{event.eventContent}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{event.source}</Badge>

            <Badge variant="secondary">{event.eventName}</Badge>

            {event.tags.map((tag) => (
              <Badge variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <div>{dayjs(event.createdAt).fromNow()}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dayjs(event.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
);
FeedEventItem.displayName = 'FeedEventItem';

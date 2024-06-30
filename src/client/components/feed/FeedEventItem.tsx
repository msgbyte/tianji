import { AppRouterOutput } from '@/api/trpc';
import React from 'react';
import { Badge } from '../ui/badge';
import dayjs from 'dayjs';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MarkdownViewer } from '../MarkdownEditor';
import { FeedIcon } from './FeedIcon';

type FeedEventItemType = AppRouterOutput['feed']['events'][number];

export const FeedEventItem: React.FC<{ event: FeedEventItemType }> = React.memo(
  ({ event }) => {
    return (
      <div className="border-muted flex items-center rounded-lg border px-4 py-2">
        <div className="flex-1 gap-2">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <div className="border-muted rounded-lg border p-2">
              <FeedIcon source={event.source} size={24} />
            </div>
            <div>
              <MarkdownViewer value={event.eventContent} />
            </div>
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
          <TooltipTrigger className="cursor-default self-end text-xs opacity-60">
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

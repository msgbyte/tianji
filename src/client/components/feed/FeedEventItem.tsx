import { AppRouterOutput } from '@/api/trpc';
import React from 'react';
import { Badge } from '../ui/badge';
import dayjs from 'dayjs';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MarkdownViewer } from '../MarkdownEditor';
import { FeedIcon } from './FeedIcon';
import { cn } from '@/utils/style';

type FeedEventItemType =
  AppRouterOutput['feed']['fetchEventsByCursor']['items'][number];

export const FeedEventItem: React.FC<{
  className?: string;
  event: FeedEventItemType;
  actions?: React.ReactNode;
}> = React.memo(({ className, event, actions }) => {
  return (
    <div
      className={cn(
        'border-muted flex items-center overflow-hidden rounded-lg border px-2 py-2 sm:px-3',
        className
      )}
    >
      <div className="relative flex-1 gap-2 overflow-hidden">
        <div className="mb-2 flex w-full items-center gap-2 overflow-hidden text-sm">
          <div className="border-muted rounded-lg border p-2">
            <FeedIcon source={event.source} size={24} />
          </div>

          <div className="overflow-hidden">
            <MarkdownViewer value={event.eventContent} />
          </div>
        </div>

        <div className="absolute right-0 top-0 flex gap-1">{actions}</div>

        <div className="flex justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge>{event.source}</Badge>

            <Badge variant="secondary">{event.eventName}</Badge>

            {event.tags.map((tag, i) => (
              <Badge key={i} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <Tooltip>
            <TooltipTrigger className="cursor-default self-end text-xs opacity-60">
              <div>{dayjs(event.createdAt).fromNow()}</div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{dayjs(event.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
});
FeedEventItem.displayName = 'FeedEventItem';

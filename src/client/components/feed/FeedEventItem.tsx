import { AppRouterOutput } from '@/api/trpc';
import React from 'react';
import { Badge } from '../ui/badge';

type FeedEventItemType = AppRouterOutput['feed']['events'][number];

export const FeedEventItem: React.FC<{ event: FeedEventItemType }> = React.memo(
  ({ event }) => {
    return (
      <div className="border-muted rounded-lg border px-4 py-2">
        <div className="mb-2">{event.eventName}</div>
        <div className="flex flex-wrap gap-2">
          <Badge>{event.source}</Badge>

          {event.tags.map((tag) => (
            <Badge variant="secondary">{tag}</Badge>
          ))}
        </div>
      </div>
    );
  }
);
FeedEventItem.displayName = 'FeedEventItem';

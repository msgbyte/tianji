import React, { ComponentProps } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/utils/style';
import { Badge } from './ui/badge';
import { useNavigate, useRouterState } from '@tanstack/react-router';

export interface CommonListItem {
  id: string;
  title: string;
  content: React.ReactNode;
  tags: string[];
  href: string;
}

interface CommonListProps {
  items: CommonListItem[];
}
export const CommonList: React.FC<CommonListProps> = React.memo((props) => {
  const { location } = useRouterState();
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-screen">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {props.items.map((item) => {
          const isSelected = item.href === location.pathname;

          return (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
                isSelected && 'bg-muted'
              )}
              onClick={() =>
                navigate({
                  to: item.href,
                })
              }
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{item.title}</div>
                  </div>
                </div>
              </div>
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {item.content}
              </div>
              {item.tags.length > 0 ? (
                <div className="flex items-center gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant={getBadgeVariantFromLabel(tag)}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
});
CommonList.displayName = 'CommonList';

/**
 * TODO
 */
function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>['variant'] {
  if (['work'].includes(label.toLowerCase())) {
    return 'default';
  }

  if (['personal'].includes(label.toLowerCase())) {
    return 'outline';
  }

  return 'secondary';
}

import React, { ComponentProps } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/utils/style';
import { Badge } from './ui/badge';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { LuSearch } from 'react-icons/lu';
import { Input } from './ui/input';
import { useFuseSearch } from '@/hooks/useFuseSearch';

export interface CommonListItem {
  id: string;
  title: string;
  content: React.ReactNode;
  tags: string[];
  href: string;
}

interface CommonListProps {
  hasSearch?: boolean;
  items: CommonListItem[];
}
export const CommonList: React.FC<CommonListProps> = React.memo((props) => {
  const { location } = useRouterState();
  const navigate = useNavigate();

  const { searchText, setSearchText, searchResult } = useFuseSearch(
    props.items,
    {
      keys: [
        {
          name: 'id',
          weight: 1,
        },
        {
          name: 'title',
          weight: 0.7,
        },
        {
          name: 'tags',
          weight: 0.3,
        },
      ],
    }
  );

  const finalList = searchResult ?? props.items;

  return (
    <>
      {props.hasSearch && (
        <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <form>
            <div className="relative">
              <LuSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-8"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </form>
        </div>
      )}

      <ScrollArea className="h-screen">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {finalList.map((item) => {
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
    </>
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

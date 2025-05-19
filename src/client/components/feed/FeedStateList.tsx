import React from 'react';
import { FeedEventItem } from './FeedEventItem';
import { trpc } from '@/api/trpc';
import { Button } from '../ui/button';
import { LuCheck, LuLink } from 'react-icons/lu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useTranslation } from '@i18next-toolkit/react';

interface FeedStateListProps {
  workspaceId: string;
  channelId: string;
}

export const FeedStateList: React.FC<FeedStateListProps> = React.memo(
  (props) => {
    const { workspaceId, channelId } = props;
    const { t } = useTranslation();
    const { data: states = [] } = trpc.feed.state.all.useQuery({
      workspaceId,
      channelId,
    });
    const trpcUtils = trpc.useUtils();
    const resolveMutation = trpc.feed.state.resolve.useMutation({
      onSuccess(data, variables, context) {
        trpcUtils.feed.state.all.setData(
          {
            workspaceId,
            channelId,
          },
          (old) => old?.filter((state) => state.id !== variables.stateId)
        );
      },
    });

    if (states.length === 0) {
      return null;
    }

    return (
      <div className="-ml-2 mb-2 divide-solid border-b pl-2 pr-2">
        {states?.map((state) => (
          <FeedEventItem
            key={state.id}
            className="animate-fade-in mb-2"
            event={state}
            actions={
              <>
                {state.url && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6 overflow-hidden"
                    onClick={() => window.open(state.url ?? '')}
                  >
                    <LuLink size={12} />
                  </Button>
                )}

                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6 overflow-hidden"
                      disabled={resolveMutation.isPending}
                      onClick={() =>
                        resolveMutation.mutateAsync({
                          workspaceId,
                          stateId: state.id,
                        })
                      }
                    >
                      <LuCheck size={12} color="green" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Mark as resolved')}</TooltipContent>
                </Tooltip>
              </>
            }
          />
        ))}
      </div>
    );
  }
);
FeedStateList.displayName = 'FeedStateList';

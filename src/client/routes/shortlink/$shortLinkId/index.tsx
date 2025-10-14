import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEvent } from '@/hooks/useEvent';
import { AlertConfirm } from '@/components/AlertConfirm';
import { LuPencil, LuTrash } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { ShortLinkCard } from '@/components/shortlink/ShortLinkCard';
import { ShortLinkStats } from '@/components/shortlink/ShortLinkStats';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Route = createFileRoute('/shortlink/$shortLinkId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { shortLinkId } = Route.useParams<{ shortLinkId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: shortLink } = trpc.shortlink.get.useQuery({
    workspaceId,
    id: shortLinkId,
  });
  const { data: stats } = trpc.shortlink.stats.useQuery({
    workspaceId,
    shortLinkId,
  });
  const hasAdminPermission = useHasAdminPermission();

  const deleteMutation = trpc.shortlink.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();
  const navigate = useNavigate();

  const handleDelete = useEvent(async () => {
    await deleteMutation.mutateAsync({ workspaceId, id: shortLinkId });
    trpcUtils.shortlink.all.refetch();
    navigate({
      to: '/shortlink',
      replace: true,
    });
  });

  const handleEdit = useEvent(() => {
    navigate({
      to: '/shortlink/$shortLinkId/edit',
      params: {
        shortLinkId,
      },
    });
  });

  if (!shortLink) {
    return (
      <CommonWrapper header={<CommonHeader title={t('Short Link')} />}>
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">{t('Loading...')}</div>
        </div>
      </CommonWrapper>
    );
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={shortLink.title || shortLink.code}
          actions={
            <div className="space-x-2">
              {hasAdminPermission && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    Icon={LuPencil}
                    onClick={handleEdit}
                  />
                  <AlertConfirm
                    title={t('Delete Short Link')}
                    description={t(
                      'Are you sure you want to delete this short link? This action cannot be undone.'
                    )}
                    onConfirm={handleDelete}
                  >
                    <Button variant="outline" size="icon" Icon={LuTrash} />
                  </AlertConfirm>
                </>
              )}
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="space-y-4">
          <ShortLinkCard
            code={shortLink.code}
            originalUrl={shortLink.originalUrl}
            title={shortLink.title}
            description={shortLink.description}
            enabled={shortLink.enabled}
            createdAt={shortLink.createdAt}
            updatedAt={shortLink.updatedAt}
          />

          {stats && <ShortLinkStats stats={stats} />}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}

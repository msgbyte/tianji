import React, { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { useTranslation } from '@i18next-toolkit/react';
import { TbBuildingLighthouse } from 'react-icons/tb';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { useCurrentWorkspaceId, useHasPermission } from '@/store/user';
import { formatDate } from '@/utils/date';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { useEvent } from '@/hooks/useEvent';
import { Badge } from '../ui/badge';
import { LuArrowRight, LuPlus } from 'react-icons/lu';
import { ROLES } from '@tianji/shared';

interface WebsiteLighthouseBtnProps {
  websiteId: string;
}
export const WebsiteLighthouseBtn: React.FC<WebsiteLighthouseBtnProps> =
  React.memo((props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const hasAdminPermission = useHasPermission(ROLES.admin);

    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
      trpc.website.getLighthouseReport.useInfiniteQuery(
        {
          workspaceId,
          websiteId: props.websiteId,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        }
      );
    const createMutation = trpc.website.generateLighthouseReport.useMutation({
      onSuccess: defaultSuccessHandler,
      onError: defaultErrorHandler,
    });

    const allData = useMemo(() => {
      if (!data) {
        return [];
      }

      return [...data.pages.flatMap((p) => p.items)];
    }, [data]);

    const handleGenerateReport = useEvent(async () => {
      if (!url) {
        toast.error(t('Url is required'));
        return;
      }

      await createMutation.mutateAsync({
        workspaceId,
        websiteId: props.websiteId,
        url,
      });
      setIsCreateDialogOpen(false);
      refetch();
    });

    return (
      <Sheet>
        <SheetTrigger>
          <Button variant="outline" size="icon" Icon={TbBuildingLighthouse} />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('Website Lighthouse Reports')}</SheetTitle>
            <SheetDescription>
              {t(
                'Lighthouse is an open-source, automated tool developed by Google, designed to evaluate the quality of web applications.'
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-2 flex flex-col gap-2">
            {hasAdminPermission && (
              <div>
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger>
                    <Button
                      variant="outline"
                      loading={createMutation.isLoading}
                      Icon={LuPlus}
                    >
                      {t('Create Report')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t('Generate Lighthouse Report')}
                      </DialogTitle>
                      <DialogDescription>
                        {t('Its will take a while to generate the report.')}
                      </DialogDescription>
                    </DialogHeader>

                    <div>
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://google.com"
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        loading={createMutation.isLoading}
                        onClick={handleGenerateReport}
                      >
                        {t('Create')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {allData.map((report) => {
                return (
                  <div className="border-border flex items-start gap-2 rounded-lg border p-2">
                    <Badge>{report.status}</Badge>

                    <div className="flex-1 overflow-hidden">
                      <div className="text-base">{report.url}</div>
                      <div className="text-sm opacity-50">
                        {formatDate(report.createdAt)}
                      </div>
                    </div>

                    {report.status === 'Success' && (
                      <Button
                        variant="outline"
                        size="icon"
                        Icon={LuArrowRight}
                        onClick={() => window.open(`/lh/${report.id}/html`)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {hasNextPage && (
              <Button
                variant="outline"
                size="icon"
                loading={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {t('Load More')}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  });
WebsiteLighthouseBtn.displayName = 'WebsiteLighthouseBtn';

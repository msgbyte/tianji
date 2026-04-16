import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc, defaultErrorHandler } from '@/api/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loading } from '@/components/Loading';
import { WorkerRevisionDiffViewer } from './WorkerRevisionDiffViewer';
import { AlertConfirm } from '@/components/AlertConfirm';
import {
  LuArrowLeftRight,
  LuArrowRight,
  LuUndo2,
  LuGitCompareArrows,
  LuDiff,
} from 'react-icons/lu';
import { SimpleTooltip } from '@/components/ui/tooltip';
import dayjs from 'dayjs';

interface WorkerRevisionsSectionProps {
  workspaceId: string;
  workerId: string;
  onRollback?: () => void;
}

export const WorkerRevisionsSection: React.FC<WorkerRevisionsSectionProps> = ({
  workspaceId,
  workerId,
  onRollback,
}) => {
  const { t } = useTranslation();
  const {
    data: revisions = [],
    isLoading,
    refetch: refetchRevisions,
  } = trpc.worker.getRevisions.useQuery({
    workspaceId,
    workerId,
  });

  const rollbackMutation = trpc.worker.rollbackToRevision.useMutation({
    onError: defaultErrorHandler,
    onSuccess: () => {
      refetchRevisions();
      onRollback?.();
    },
  });
  const [baseRevisionId, setBaseRevisionId] = useState<string | null>(null);
  const [targetRevisionId, setTargetRevisionId] = useState<string | null>(null);

  useEffect(() => {
    if (!revisions.length) {
      setBaseRevisionId(null);
      setTargetRevisionId(null);
      return;
    }

    setTargetRevisionId((prev) => prev ?? revisions[0]?.id ?? null);
    if (revisions.length > 1) {
      setBaseRevisionId((prev) => prev ?? revisions[1]?.id ?? null);
    } else {
      setBaseRevisionId((prev) => prev ?? revisions[0]?.id ?? null);
    }
  }, [revisions]);

  const baseRevision = useMemo(() => {
    if (!baseRevisionId) return null;
    return revisions.find((revision) => revision.id === baseRevisionId) ?? null;
  }, [baseRevisionId, revisions]);

  const targetRevision = useMemo(() => {
    if (!targetRevisionId) return null;
    return (
      revisions.find((revision) => revision.id === targetRevisionId) ?? null
    );
  }, [revisions, targetRevisionId]);

  const handleShowLatestDiff = () => {
    if (!revisions.length) {
      return;
    }

    const latest = revisions[0];
    const previous = revisions[1] ?? revisions[0];

    setTargetRevisionId(latest.id);
    setBaseRevisionId(previous.id);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t('Revision History')}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="icon"
          Icon={LuArrowLeftRight}
          onClick={handleShowLatestDiff}
          disabled={!revisions.length}
          className="h-8 w-8"
          aria-label={t('Show latest revision diff')}
        />
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          {isLoading ? (
            <Loading />
          ) : revisions.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              {t('No revision history available yet.')}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-1">
                <div className="space-y-2">
                  <Label>{t('Base Revision')}</Label>
                  <Select
                    value={baseRevisionId ?? undefined}
                    onValueChange={(value) => setBaseRevisionId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select revision')} />
                    </SelectTrigger>
                    <SelectContent>
                      {revisions.map((revision) => (
                        <SelectItem key={revision.id} value={revision.id}>
                          {t('Revision #{{num}}', {
                            num: revision.revision,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="self-end pb-2 text-center">
                  <LuArrowRight />
                </div>

                <div className="space-y-2">
                  <Label>{t('Comparison Revision')}</Label>
                  <Select
                    value={targetRevisionId ?? undefined}
                    onValueChange={(value) => setTargetRevisionId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select revision')} />
                    </SelectTrigger>
                    <SelectContent>
                      {revisions.map((revision) => (
                        <SelectItem key={revision.id} value={revision.id}>
                          {t('Revision #{{num}}', {
                            num: revision.revision,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{t('Timeline')}</Label>
                <ScrollArea className="mt-2 h-[480px] rounded-md border">
                  <div className="divide-y">
                    {revisions.map((revision, index) => {
                      const createdAt = dayjs(revision.createdAt);
                      const isLatest = index === 0;
                      const isBase = revision.id === baseRevisionId;
                      const isTarget = revision.id === targetRevisionId;
                      return (
                        <div
                          key={revision.id}
                          className="flex flex-col items-start justify-between gap-2 px-3 py-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {t('Revision #{{num}}', {
                                  num: revision.revision,
                                })}
                              </span>
                              {isLatest && (
                                <Badge variant="secondary">{t('Latest')}</Badge>
                              )}
                              {isTarget && (
                                <Badge variant="default">{t('Compare')}</Badge>
                              )}
                              {isBase && (
                                <Badge variant="outline">{t('Base')}</Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {createdAt.isValid()
                                ? createdAt.format('YYYY-MM-DD HH:mm:ss')
                                : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <SimpleTooltip content={t('Set base')}>
                              <Button
                                type="button"
                                size="icon"
                                variant={isBase ? 'default' : 'ghost'}
                                onClick={() => setBaseRevisionId(revision.id)}
                                className="h-7 w-7"
                                Icon={LuGitCompareArrows}
                              />
                            </SimpleTooltip>
                            <SimpleTooltip content={t('Set compare')}>
                              <Button
                                type="button"
                                size="icon"
                                variant={isTarget ? 'default' : 'ghost'}
                                onClick={() => setTargetRevisionId(revision.id)}
                                className="h-7 w-7"
                                Icon={LuDiff}
                              />
                            </SimpleTooltip>
                            {!isLatest && (
                              <AlertConfirm
                                title={t('Rollback to Revision #{{num}}', {
                                  num: revision.revision,
                                })}
                                description={t(
                                  'Are you sure you want to rollback the worker code to this revision? This will create a new revision with the rolled-back code.'
                                )}
                                onConfirm={async () => {
                                  await rollbackMutation.mutateAsync({
                                    workspaceId,
                                    workerId,
                                    revisionId: revision.id,
                                  });
                                }}
                              >
                                <SimpleTooltip content={t('Rollback')}>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    Icon={LuUndo2}
                                    loading={rollbackMutation.isPending}
                                  />
                                </SimpleTooltip>
                              </AlertConfirm>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          {isLoading ? (
            <Loading />
          ) : !baseRevision || !targetRevision ? (
            <div className="text-muted-foreground text-sm">
              {t('Select two revisions to view code differences.')}
            </div>
          ) : (
            <WorkerRevisionDiffViewer
              className="flex-1"
              leftTitle={t('Revision #{{num}}', {
                num: baseRevision.revision,
              })}
              rightTitle={t('Revision #{{num}}', {
                num: targetRevision.revision,
              })}
              leftCode={baseRevision.code}
              rightCode={targetRevision.code}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
WorkerRevisionsSection.displayName = 'WorkerRevisionsSection';

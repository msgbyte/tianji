import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useNavigate } from '@tanstack/react-router';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import { LuCopy, LuDownload, LuTrash } from 'react-icons/lu';
import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import { AlertConfirm } from '@/components/AlertConfirm';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { Button } from '@/components/ui/button';
import {
  useCurrentWorkspaceId,
  useHasAdminPermission,
  useUserInfo,
} from '@/store/user';
import { ArtifactViewer } from './ArtifactViewer';

export function ArtifactDetail({
  artifactId,
  workspaceId: targetWorkspaceId,
}: {
  artifactId: string;
  workspaceId?: string;
}) {
  const { t } = useTranslation();
  const currentWorkspaceId = useCurrentWorkspaceId();
  const user = useUserInfo();
  const workspaceId = targetWorkspaceId || currentWorkspaceId;
  const membership = user?.workspaces.find(
    ({ workspace }) => workspace.id === workspaceId
  );

  if (!membership || workspaceId !== currentWorkspaceId) {
    return (
      <CommonWrapper header={<CommonHeader title={t('Artifacts')} />}>
        <div className="mx-auto max-w-md space-y-4 p-6">
          {!membership ? (
            <p>{t('You do not have access to this workspace.')}</p>
          ) : (
            <>
              <p>
                {t('Switch to {{workspace}} to view this artifact.', {
                  workspace: membership.workspace.name,
                })}
              </p>
              <WorkspaceSwitcher isCollapsed={false} />
            </>
          )}
        </div>
      </CommonWrapper>
    );
  }
  // A different workspace or artifact must never retain the previous iframe.
  return (
    <ArtifactContent
      key={`${workspaceId}:${artifactId}`}
      workspaceId={workspaceId}
      artifactId={artifactId}
    />
  );
}

function ArtifactContent({
  workspaceId,
  artifactId,
}: {
  workspaceId: string;
  artifactId: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const admin = useHasAdminPermission();
  const {
    data: artifact,
    isLoading,
    error,
    refetch,
  } = trpc.artifact.get.useQuery({ workspaceId, artifactId });
  const remove = trpc.artifact.delete.useMutation({
    onError: defaultErrorHandler,
    onSuccess: defaultSuccessHandler,
  });

  if (error || !artifact) {
    const code = error?.data?.code;
    const message =
      code === 'NOT_FOUND'
        ? t('Artifact not found.')
        : code === 'FORBIDDEN' || code === 'UNAUTHORIZED'
          ? t('You do not have access to this artifact.')
          : isLoading
            ? t('Loading...')
            : t('Unable to load artifact.');
    return (
      <CommonWrapper header={<CommonHeader title={t('Artifacts')} />}>
        <div className="space-y-4 p-6" role={error ? 'alert' : 'status'}>
          <p>{message}</p>
          {error && (
            <Button variant="outline" onClick={() => refetch()}>
              {t('Retry')}
            </Button>
          )}
        </div>
      </CommonWrapper>
    );
  }

  const handleDelete = async () => {
    try {
      await remove.mutateAsync({ workspaceId, artifactId });
      await utils.artifact.list.invalidate();
      navigate({ to: '/artifacts', replace: true });
    } catch {
      // The mutation's error handler displays the failure without leaving this page.
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([artifact.source], { type: 'text/html;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `artifact-${artifact.id}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <CommonWrapper header={<CommonHeader title={artifact.title} />}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="max-h-[40%] shrink-0 space-y-2 overflow-auto p-4">
          {artifact.description && (
            <p className="whitespace-pre-wrap break-words text-sm">
              {artifact.description}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            {t(
              'Created by {{author}} · Revision {{revision}} · Updated {{date}}',
              {
                author:
                  artifact.createdBy?.nickname ||
                  artifact.createdBy?.username ||
                  t('Deleted user'),
                revision: artifact.revision,
                date: new Date(artifact.updatedAt).toLocaleString(),
              }
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              Icon={LuCopy}
              onClick={() => {
                if (copy(new URL(artifact.path, window.location.origin).href))
                  toast(t('Copied into clipboard!'));
              }}
            >
              {t('Copy link')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              Icon={LuDownload}
              onClick={download}
            >
              {t('Download HTML')}
            </Button>
            {admin && (
              <AlertConfirm
                title={t('Delete artifact')}
                description={t(
                  'This permanently deletes the artifact for everyone in this workspace.'
                )}
                onConfirm={handleDelete}
              >
                <Button
                  variant="outline"
                  size="sm"
                  Icon={LuTrash}
                  loading={remove.isPending}
                >
                  {t('Delete artifact')}
                </Button>
              </AlertConfirm>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {t(
              'Preview runs in a restricted sandbox. Downloaded HTML runs outside these restrictions when opened locally.'
            )}
          </p>
        </div>
        <ArtifactViewer source={artifact.source} title={artifact.title} />
      </div>
    </CommonWrapper>
  );
}

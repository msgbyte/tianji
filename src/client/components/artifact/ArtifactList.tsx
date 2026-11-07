import React, { useState } from 'react';
import { useDebounce } from 'ahooks';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonList } from '@/components/CommonList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentWorkspaceId } from '@/store/user';
import { ArtifactSkillDialog } from './ArtifactSkillDialog';

export function ArtifactList() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, { wait: 250 });
  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={t('Artifacts')}
          actions={<ArtifactSkillDialog />}
        />
      }
    >
      <div className="flex h-full flex-col">
        <div className="px-4 py-2">
          <Input
            aria-label={t('Search artifacts')}
            placeholder={t('Search artifacts')}
            maxLength={200}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <ArtifactListResults
          key={`${workspaceId}:${debouncedSearch}`}
          workspaceId={workspaceId}
          search={debouncedSearch}
        />
      </div>
    </CommonWrapper>
  );
}

function ArtifactListResults({
  workspaceId,
  search,
}: {
  workspaceId: string;
  search: string;
}) {
  const { t } = useTranslation();
  const [pages, setPages] = useState(1);
  const queries = trpc.useQueries((api) =>
    Array.from({ length: pages }, (_, index) =>
      api.artifact.list({ workspaceId, search, page: index + 1, pageSize: 50 })
    )
  );
  const items = [
    ...new Map(
      queries
        .flatMap((query) => query.data?.items ?? [])
        .map((item) => [item.id, item])
    ).values(),
  ];
  const failed = queries.find((query) => query.error);
  return (
    <>
      {failed && (
        <div className="space-y-2 px-4 py-2" role="alert">
          <p>{t('Unable to load artifacts.')}</p>
          <Button variant="outline" onClick={() => failed.refetch()}>
            {t('Retry')}
          </Button>
        </div>
      )}
      <div className="min-h-0 flex-1">
        {(!failed || items.length > 0) && (
          <CommonList
            isLoading={queries.some((query) => query.isLoading)}
            emptyDescription={
              search
                ? t('No matching artifacts.')
                : t(
                    'No artifacts yet. Install the Skill to publish your first HTML page.'
                  )
            }
            items={items.map((item) => ({
              id: item.id,
              title: item.title,
              href: item.path,
              content: (
                <>
                  <div className="line-clamp-2">{item.description}</div>
                  <time dateTime={item.updatedAt}>
                    {new Date(item.updatedAt).toLocaleString()}
                  </time>
                </>
              ),
            }))}
          />
        )}
      </div>
      {queries.at(-1)?.data?.hasMore && (
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setPages((value) => value + 1)}
          >
            {t('Load more')}
          </Button>
        </div>
      )}
    </>
  );
}

import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import {
  SharedModuleEditForm,
  type SharedModuleEditFormValues,
} from '@/components/worker/SharedModuleEditForm';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvent } from '@/hooks/useEvent';
import {
  useCurrentWorkspaceId,
  useHasAdminPermission,
  useUserInfo,
} from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';

export const Route = createFileRoute('/worker/modules/$moduleId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { moduleId } = Route.useParams<{ moduleId: string }>();
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const hasAdminPermission = useHasAdminPermission();
  const userId = useUserInfo()?.id;
  const utils = trpc.useUtils();
  const input = { workspaceId, moduleId };
  const moduleQuery = trpc.sharedModule.get.useQuery(input);
  const revisionsQuery = trpc.sharedModule.revisions.useQuery(input);
  const consumersQuery = trpc.sharedModule.consumers.useQuery(input);
  const publishMutation = trpc.sharedModule.publish.useMutation({
    onError: defaultErrorHandler,
  });
  const archiveMutation = trpc.sharedModule.archive.useMutation({
    onError: defaultErrorHandler,
  });

  const refresh = async () => {
    await Promise.all([
      utils.sharedModule.get.invalidate(input),
      utils.sharedModule.all.invalidate({ workspaceId }),
      utils.sharedModule.revisions.invalidate(input),
      utils.sharedModule.consumers.invalidate(input),
      utils.sharedModule.bindingOptions.invalidate({ workspaceId }),
    ]);
  };

  const publish = useEvent(async (values: SharedModuleEditFormValues) => {
    const { revision } = await publishMutation.mutateAsync({
      id: moduleId,
      workspaceId,
      ...values,
    });
    await refresh();
    toast.success(
      t('Published revision #{{revision}}', { revision: revision.revision })
    );
  });

  const archive = useEvent(async () => {
    await archiveMutation.mutateAsync(input);
    await refresh();
    toast.success(t('Shared module archived'));
  });

  if (
    moduleQuery.isLoading ||
    revisionsQuery.isLoading ||
    consumersQuery.isLoading
  ) {
    return <Loading />;
  }
  const module = moduleQuery.data;
  if (!module) return <ErrorTip />;
  const revisions = revisionsQuery.data ?? [];
  const consumers = consumersQuery.data ?? [];
  const canEdit = hasAdminPermission || module.ownerId === userId;

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={module.name}
          desc={module.importAlias}
          actions={
            module.archivedAt ? (
              <Badge variant="secondary">{t('Archived')}</Badge>
            ) : (
              <Badge variant="outline">
                {t('Latest revision: #{{revision}}', {
                  revision: module.latestRevision,
                })}
              </Badge>
            )
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList>
            <TabsTrigger value="editor">{t('Editor')}</TabsTrigger>
            <TabsTrigger value="revisions">{t('Revisions')}</TabsTrigger>
            <TabsTrigger value="consumers">{t('Consumers')}</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-6">
            <SharedModuleEditForm
              moduleId={module.id}
              latestRevision={module.latestRevision}
              archived={Boolean(module.archivedAt)}
              readOnly={!canEdit}
              defaultValues={{
                name: module.name,
                description: module.description ?? '',
                importAlias: module.importAlias,
                source: revisions[0]?.source ?? '',
                ownerId: module.ownerId ?? undefined,
              }}
              onPublish={publish}
              publishing={publishMutation.isPending}
              onArchive={archive}
            />
          </TabsContent>

          <TabsContent value="revisions" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('Revision History')}</CardTitle>
                <CardDescription>
                  {t('Published source and declarations are immutable.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {revisions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t('No published revisions yet.')}
                  </p>
                ) : (
                  revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium">#{revision.revision}</div>
                        <div className="text-muted-foreground text-xs">
                          {revision.operator?.nickname ??
                            revision.operator?.username ??
                            t('Unknown')}
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {dayjs(revision.createdAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {revisions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('Revision Comparison')}</CardTitle>
                  <CardDescription>
                    {t(
                      'Review the immutable source and declaration artifacts before upgrading a worker binding.'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RevisionComparison revisions={revisions} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="consumers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('Consumers')}</CardTitle>
                <CardDescription>
                  {t('Workers currently pinned to this module.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {consumers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t('No workers use this module yet.')}
                  </p>
                ) : (
                  consumers.map((consumer) => (
                    <Link
                      key={consumer.id}
                      to="/worker/$workerId"
                      params={{ workerId: consumer.worker.id }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
                    >
                      <span>{consumer.worker.name}</span>
                      <Badge variant="outline">
                        #{consumer.moduleRevision.revision}
                      </Badge>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </CommonWrapper>
  );
}

interface RevisionComparisonProps {
  revisions: Array<{
    id: string;
    revision: number;
    source: string;
    declarationCode: string;
  }>;
}

function RevisionComparison({ revisions }: RevisionComparisonProps) {
  const { t } = useTranslation();
  const [fromId, setFromId] = useState(revisions[1]?.id ?? revisions[0]?.id);
  const [toId, setToId] = useState(revisions[0]?.id);
  const first = revisions[0];
  if (!first) return null;
  const from = revisions.find((revision) => revision.id === fromId) ?? first;
  const to = revisions.find((revision) => revision.id === toId) ?? first;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <RevisionSelect
          label={t('From revision')}
          revisions={revisions}
          value={from.id}
          onValueChange={setFromId}
        />
        <RevisionSelect
          label={t('To revision')}
          revisions={revisions}
          value={to.id}
          onValueChange={setToId}
        />
      </div>
      <Tabs defaultValue="source">
        <TabsList>
          <TabsTrigger value="source">{t('Source')}</TabsTrigger>
          <TabsTrigger value="declaration">{t('Declaration')}</TabsTrigger>
        </TabsList>
        <TabsContent value="source">
          <RevisionArtifactComparison
            fromLabel={`#${from.revision}`}
            fromValue={from.source}
            toLabel={`#${to.revision}`}
            toValue={to.source}
          />
        </TabsContent>
        <TabsContent value="declaration">
          <RevisionArtifactComparison
            fromLabel={`#${from.revision}`}
            fromValue={from.declarationCode}
            toLabel={`#${to.revision}`}
            toValue={to.declarationCode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RevisionSelect({
  label,
  revisions,
  value,
  onValueChange,
}: {
  label: string;
  revisions: RevisionComparisonProps['revisions'];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {revisions.map((revision) => (
            <SelectItem key={revision.id} value={revision.id}>
              #{revision.revision}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function RevisionArtifactComparison({
  fromLabel,
  fromValue,
  toLabel,
  toValue,
}: {
  fromLabel: string;
  fromValue: string;
  toLabel: string;
  toValue: string;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {[
        [fromLabel, fromValue],
        [toLabel, toValue],
      ].map(([label, value], index) => (
        <div
          key={`${label}:${index}`}
          className="min-w-0 overflow-hidden rounded-lg border"
        >
          <div className="bg-muted border-b px-3 py-2 font-mono text-xs">
            {label}
          </div>
          <pre className="max-h-[32rem] overflow-auto p-4 text-xs">{value}</pre>
        </div>
      ))}
    </div>
  );
}

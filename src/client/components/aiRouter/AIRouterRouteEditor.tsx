import { AppRouterOutput, defaultErrorHandler, trpc } from '@/api/trpc';
import { ColorTag } from '@/components/ColorTag';
import { StrictModeDroppable } from '@/components/Sortable/StrictModeDroppable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { reorder } from '@/utils/reorder';
import { useTranslation } from '@i18next-toolkit/react';
import { Select as AntdSelect } from 'antd';
import React, { useMemo } from 'react';
import {
  DragDropContext,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import {
  LuGitBranchPlus,
  LuGripVertical,
  LuPencil,
  LuPlus,
  LuTrash,
} from 'react-icons/lu';

type AIRouterInfo = NonNullable<AppRouterOutput['aiRouter']['info']>;
type AIRouterTier = AIRouterInfo['tiers'][number];
type AIRouterNode = AIRouterTier['nodes'][number];
type AIRouterNodeDraft = Pick<
  AIRouterNode,
  | 'gatewayId'
  | 'provider'
  | 'order'
  | 'enabled'
  | 'weight'
  | 'modelOverride'
  | 'timeoutMs'
  | 'retryableStatusCodes'
>;

interface AIRouterTierView {
  id: string;
  order: number;
  nodes: AIRouterNode[];
}

interface AIRouterTierDraft {
  order: number;
  nodes: AIRouterNodeDraft[];
}

interface AIRouterRouteEditorProps {
  routerId: string;
  tiers: AIRouterTier[];
  canEdit?: boolean;
}

interface AddNodeFormState {
  gatewayId: string;
  provider: AIRouterProviderValue;
  weight: string;
  modelOverride: string;
  timeoutMs: string;
  retryableStatusCodes: number[];
}

const aiRouterProviderOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'Custom' },
] as const;

type AIRouterProviderValue = (typeof aiRouterProviderOptions)[number]['value'];

const retryableStatusCodeGroups = [
  {
    label: '4xx Client Errors',
    options: [
      { value: 408, label: 'Request Timeout' },
      { value: 409, label: 'Conflict' },
      { value: 425, label: 'Too Early' },
      { value: 429, label: 'Too Many Requests' },
    ],
  },
  {
    label: '5xx Server Errors',
    options: [
      { value: 500, label: 'Internal Server Error' },
      { value: 501, label: 'Not Implemented' },
      { value: 502, label: 'Bad Gateway' },
      { value: 503, label: 'Service Unavailable' },
      { value: 504, label: 'Gateway Timeout' },
      { value: 505, label: 'HTTP Version Not Supported' },
      { value: 506, label: 'Variant Also Negotiates' },
      { value: 507, label: 'Insufficient Storage' },
      { value: 508, label: 'Loop Detected' },
      { value: 510, label: 'Not Extended' },
      { value: 511, label: 'Network Authentication Required' },
    ],
  },
] as const;

const defaultAddNodeFormState: AddNodeFormState = {
  gatewayId: '',
  provider: 'openai',
  weight: '100',
  modelOverride: '',
  timeoutMs: '30000',
  retryableStatusCodes: [429, 500, 502, 503, 504],
};

export const AIRouterRouteEditor: React.FC<AIRouterRouteEditorProps> =
  React.memo(({ routerId, tiers, canEdit = true }) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const trpcUtils = trpc.useUtils();
    const [editingTierIndex, setEditingTierIndex] = React.useState<
      number | null
    >(null);
    const [editingNodeIndex, setEditingNodeIndex] = React.useState<
      number | null
    >(null);
    const [addNodeForm, setAddNodeForm] = React.useState<AddNodeFormState>(
      defaultAddNodeFormState
    );

    const displayTiers = useMemo(() => normalizeTierViews(tiers), [tiers]);

    const {
      data: compatibleGateways = [],
      isLoading: isCompatibleGatewaysLoading,
    } = trpc.aiRouter.compatibleGateways.useQuery(
      {
        workspaceId,
      },
      {
        enabled: editingTierIndex !== null,
      }
    );

    const replaceTiersMutation = trpc.aiRouter.replaceTiers.useMutation({
      onError: defaultErrorHandler,
      onSuccess: async () => {
        await trpcUtils.aiRouter.info.invalidate({
          workspaceId,
          routerId,
        });
        await trpcUtils.aiRouter.all.invalidate({
          workspaceId,
        });
      },
    });

    const persistTiers = useEvent(async (nextTiers: AIRouterTierDraft[]) => {
      await replaceTiersMutation.mutateAsync({
        workspaceId,
        routerId,
        tiers: normalizeTiersForMutation(nextTiers),
      });
    });

    const handleAddTier = useEvent(async () => {
      await persistTiers([
        ...displayTiers,
        {
          order: displayTiers.length,
          nodes: [],
        },
      ]);
    });

    const handleOpenAddDialog = useEvent((tierIndex: number) => {
      setEditingTierIndex(tierIndex);
      setEditingNodeIndex(null);
      setAddNodeForm(defaultAddNodeFormState);
    });

    const handleOpenEditDialog = useEvent(
      (tierIndex: number, nodeIndex: number, node: AIRouterNode) => {
        setEditingTierIndex(tierIndex);
        setEditingNodeIndex(nodeIndex);
        setAddNodeForm(createNodeFormState(node));
      }
    );

    const handleCloseNodeDialog = useEvent(() => {
      setEditingTierIndex(null);
      setEditingNodeIndex(null);
    });

    const handleSubmitNode = useEvent(
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingTierIndex === null || !addNodeForm.gatewayId) {
          return;
        }

        const targetTier = displayTiers[editingTierIndex];

        if (
          !targetTier ||
          (editingNodeIndex !== null && !targetTier.nodes[editingNodeIndex])
        ) {
          return;
        }

        const nextTiers = displayTiers.map((tier, tierIndex) => {
          if (tierIndex !== editingTierIndex) {
            return tier;
          }

          const existingNode =
            editingNodeIndex !== null ? tier.nodes[editingNodeIndex] : null;
          const nextNode: AIRouterNodeDraft = {
            gatewayId: addNodeForm.gatewayId,
            provider: addNodeForm.provider,
            order: existingNode?.order ?? tier.nodes.length,
            enabled: existingNode?.enabled ?? true,
            weight: normalizeWeight(addNodeForm.weight),
            modelOverride: addNodeForm.modelOverride.trim() || null,
            timeoutMs: normalizeTimeoutMs(addNodeForm.timeoutMs),
            retryableStatusCodes: normalizeRetryableStatusCodes(
              addNodeForm.retryableStatusCodes
            ),
          };

          if (editingNodeIndex !== null) {
            return {
              ...tier,
              nodes: tier.nodes.map((node, nodeIndex) =>
                nodeIndex === editingNodeIndex ? nextNode : node
              ),
            };
          }

          return {
            ...tier,
            nodes: [...tier.nodes, nextNode],
          };
        });

        await persistTiers(nextTiers);
        handleCloseNodeDialog();
      }
    );

    const handleTierDragEnd = useEvent(async (result: DropResult) => {
      if (
        !result.destination ||
        result.source.index === result.destination.index ||
        isSaving ||
        !canEdit
      ) {
        return;
      }

      await persistTiers(
        reorder(displayTiers, result.source.index, result.destination.index)
      );
    });

    const handleRemoveTier = useEvent(async (tierIndex: number) => {
      if (displayTiers.length <= 1) {
        return;
      }

      await persistTiers(
        displayTiers.filter((_, index) => index !== tierIndex)
      );
    });

    const handleToggleNode = useEvent(
      async (tierIndex: number, nodeIndex: number, enabled: boolean) => {
        const tier = displayTiers[tierIndex];

        if (!tier) {
          return;
        }

        const nextTierNodes = tier.nodes.map((node, index) =>
          index === nodeIndex
            ? {
                ...node,
                enabled,
              }
            : node
        );

        await replaceTierNodes(tierIndex, nextTierNodes);
      }
    );

    const handleRemoveNode = useEvent(
      async (tierIndex: number, nodeIndex: number) => {
        const tier = displayTiers[tierIndex];

        if (!tier) {
          return;
        }

        await replaceTierNodes(
          tierIndex,
          tier.nodes.filter((_, index) => index !== nodeIndex)
        );
      }
    );

    const replaceTierNodes = useEvent(
      async (tierIndex: number, nextTierNodes: AIRouterNodeDraft[]) => {
        const nextTiers = displayTiers.map((tier, index) =>
          index === tierIndex
            ? {
                ...tier,
                nodes: nextTierNodes,
              }
            : tier
        );

        await persistTiers(nextTiers);
      }
    );

    const isSaving = replaceTiersMutation.isPending;
    const isEditingRoute =
      editingTierIndex !== null && editingNodeIndex !== null;

    return (
      <div className="space-y-3">
        <DragDropContext onDragEnd={handleTierDragEnd}>
          <StrictModeDroppable droppableId="ai-router-tiers">
            {(dropProvided) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className="space-y-3"
              >
                {displayTiers.map((tier, tierIndex) => (
                  <Draggable
                    key={tier.id}
                    draggableId={tier.id}
                    index={tierIndex}
                    isDragDisabled={isSaving || !canEdit}
                  >
                    {(dragProvided, snapshot) => (
                      <section
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={dragProvided.draggableProps.style}
                        className={`bg-background overflow-hidden rounded-md border ${
                          snapshot.isDragging
                            ? 'shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700'
                            : ''
                        }`}
                      >
                        <div className="bg-muted/30 flex flex-col gap-3 border-b px-3 py-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex min-w-0 items-start gap-2">
                            <button
                              type="button"
                              {...dragProvided.dragHandleProps}
                              className="text-muted-foreground hover:bg-muted mt-0.5 inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded border bg-background disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={t('Drag tier')}
                              title={t('Drag tier')}
                              disabled={isSaving || !canEdit}
                            >
                              <LuGripVertical className="h-4 w-4" />
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-sm font-semibold">
                                  {t('Tier')} {tierIndex + 1}
                                </h3>
                                <span className="text-muted-foreground rounded border px-1.5 py-0.5 text-xs">
                                  {tier.nodes.length}
                                </span>
                              </div>
                              <div className="text-muted-foreground mt-0.5 truncate text-xs">
                                {t(
                                  'Gateways in this tier share traffic by weight.'
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              Icon={LuTrash}
                              aria-label={t('Remove tier')}
                              title={t('Remove tier')}
                              disabled={
                                isSaving ||
                                !canEdit ||
                                displayTiers.length <= 1
                              }
                              onClick={() => handleRemoveTier(tierIndex)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              Icon={LuPlus}
                              onClick={() => handleOpenAddDialog(tierIndex)}
                              disabled={isSaving || !canEdit}
                            >
                              {t('Add Gateway')}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 p-3">
                          {tier.nodes.length === 0 ? (
                            <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
                              {t('No gateway configured for this tier.')}
                            </div>
                          ) : (
                            tier.nodes.map((node, nodeIndex) => (
                              <div
                                key={`${tier.id}:${node.gatewayId}:${nodeIndex}`}
                                className="grid gap-3 rounded-md border px-3 py-2 text-sm lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)_auto]"
                              >
                                <div className="min-w-0">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <ColorTag
                                      label={formatProviderLabel(
                                        node.provider
                                      )}
                                    />
                                    <span className="truncate font-medium">
                                      {node.gateway?.name ?? node.gatewayId}
                                    </span>
                                  </div>
                                  <div className="text-muted-foreground mt-1 truncate text-xs">
                                    {node.modelOverride
                                      ? t('Model override') +
                                        `: ${node.modelOverride}`
                                      : t('Use request model')}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                                  <Metric
                                    label={t('Weight')}
                                    value={node.weight}
                                  />
                                  <Metric
                                    label={t('Timeout')}
                                    value={`${node.timeoutMs}ms`}
                                  />
                                  <Metric
                                    label={t('Retryable')}
                                    value={
                                      node.retryableStatusCodes.length > 0
                                        ? node.retryableStatusCodes.join(', ')
                                        : '-'
                                    }
                                  />
                                  <Metric
                                    label={t('Status')}
                                    value={
                                      node.enabled
                                        ? t('Enabled')
                                        : t('Disabled')
                                    }
                                  />
                                </div>

                                <div className="flex items-center justify-end gap-1">
                                  {canEdit && (
                                    <>
                                      <Switch
                                        aria-label={t('Toggle node enabled')}
                                        checked={node.enabled}
                                        onCheckedChange={(enabled) =>
                                          handleToggleNode(
                                            tierIndex,
                                            nodeIndex,
                                            enabled
                                          )
                                        }
                                        disabled={isSaving}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        Icon={LuPencil}
                                        aria-label={t('Edit route')}
                                        title={t('Edit route')}
                                        disabled={isSaving}
                                        onClick={() =>
                                          handleOpenEditDialog(
                                            tierIndex,
                                            nodeIndex,
                                            node
                                          )
                                        }
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        Icon={LuTrash}
                                        aria-label={t('Remove node')}
                                        title={t('Remove node')}
                                        disabled={isSaving}
                                        onClick={() =>
                                          handleRemoveNode(tierIndex, nodeIndex)
                                        }
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    )}
                  </Draggable>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </DragDropContext>

        <div className="flex justify-start">
          <Button
            variant="outline"
            size="sm"
            Icon={LuGitBranchPlus}
            onClick={handleAddTier}
            disabled={isSaving || !canEdit}
          >
            {t('Add Tier')}
          </Button>
        </div>

        <Dialog
          open={editingTierIndex !== null}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseNodeDialog();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditingRoute
                  ? t('Edit Gateway Route')
                  : t('Add Gateway Route')}
              </DialogTitle>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleSubmitNode}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="gatewayId">
                  {t('Gateway')}
                </label>
                <Select
                  value={addNodeForm.gatewayId}
                  onValueChange={(gatewayId) =>
                    setAddNodeForm((prev) => ({
                      ...prev,
                      gatewayId,
                    }))
                  }
                  disabled={isCompatibleGatewaysLoading || isSaving}
                  required
                >
                  <SelectTrigger id="gatewayId">
                    <SelectValue
                      placeholder={
                        isCompatibleGatewaysLoading
                          ? t('Loading gateways...')
                          : t('Select gateway')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibleGateways.map((gateway) => (
                      <SelectItem key={gateway.id} value={gateway.id}>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{gateway.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {compatibleGateways.length === 0 &&
                  !isCompatibleGatewaysLoading && (
                    <p className="text-muted-foreground text-xs">
                      {t('No compatible gateways are available.')}
                    </p>
                  )}
              </div>

              {addNodeForm.gatewayId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="provider">
                    {t('Provider')}
                  </label>
                  <Select
                    value={addNodeForm.provider}
                    onValueChange={(provider) =>
                      setAddNodeForm((prev) => ({
                        ...prev,
                        provider: normalizeProvider(provider),
                      }))
                    }
                    disabled={isSaving}
                    required
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder={t('Select provider')} />
                    </SelectTrigger>
                    <SelectContent>
                      {aiRouterProviderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="weight">
                    {t('Weight')}
                  </label>
                  <Input
                    id="weight"
                    type="number"
                    min={0}
                    max={100000}
                    step={1}
                    value={addNodeForm.weight}
                    onChange={(event) =>
                      setAddNodeForm((prev) => ({
                        ...prev,
                        weight: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <OptionalLabel htmlFor="modelOverride">
                    {t('Model Override')}
                  </OptionalLabel>
                  <Input
                    id="modelOverride"
                    value={addNodeForm.modelOverride}
                    placeholder={t('Use request model')}
                    onChange={(event) =>
                      setAddNodeForm((prev) => ({
                        ...prev,
                        modelOverride: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="timeoutMs">
                    {t('Timeout')}
                  </label>
                  <div className="relative">
                    <Input
                      id="timeoutMs"
                      type="number"
                      min={1000}
                      max={300000}
                      step={1000}
                      value={addNodeForm.timeoutMs}
                      className="pr-10"
                      onChange={(event) =>
                        setAddNodeForm((prev) => ({
                          ...prev,
                          timeoutMs: event.target.value,
                        }))
                      }
                    />
                    <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                      ms
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="retryableStatusCodes"
                  >
                    {t('Retryable Status Codes')}
                  </label>
                  <AntdSelect
                    className="w-full"
                    id="retryableStatusCodes"
                    mode="multiple"
                    value={addNodeForm.retryableStatusCodes}
                    placeholder={t('Select retryable status codes')}
                    optionFilterProp="children"
                    onChange={(retryableStatusCodes) =>
                      setAddNodeForm((prev) => ({
                        ...prev,
                        retryableStatusCodes:
                          normalizeRetryableStatusCodes(retryableStatusCodes),
                      }))
                    }
                  >
                    {retryableStatusCodeGroups.map((group) => (
                      <AntdSelect.OptGroup
                        key={group.label}
                        label={t(group.label)}
                      >
                        {group.options.map((option) => (
                          <AntdSelect.Option
                            key={option.value}
                            value={option.value}
                          >
                            {option.value} - {t(option.label)}
                          </AntdSelect.Option>
                        ))}
                      </AntdSelect.OptGroup>
                    ))}
                  </AntdSelect>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseNodeDialog}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  Icon={LuPlus}
                  loading={isSaving}
                  disabled={
                    !addNodeForm.gatewayId ||
                    isCompatibleGatewaysLoading
                  }
                >
                  {isEditingRoute ? t('Save Gateway') : t('Add Gateway')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  });

AIRouterRouteEditor.displayName = 'AIRouterRouteEditor';

function createNodeFormState(node: AIRouterNodeDraft): AddNodeFormState {
  return {
    gatewayId: node.gatewayId,
    provider: normalizeProvider(node.provider),
    weight: String(normalizeWeight(node.weight)),
    modelOverride: node.modelOverride ?? '',
    timeoutMs: String(normalizeTimeoutMs(node.timeoutMs)),
    retryableStatusCodes: normalizeRetryableStatusCodes(
      node.retryableStatusCodes ?? []
    ),
  };
}

function OptionalLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  const { t } = useTranslation();

  return (
    <label className="text-sm font-medium" htmlFor={htmlFor}>
      {children}
      <span className="ml-1 text-xs opacity-40">{t('Optional')}</span>
    </label>
  );
}

function Metric(props: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded border px-2 py-1">
      <div className="text-muted-foreground truncate">{props.label}</div>
      <div className="truncate font-medium">{props.value}</div>
    </div>
  );
}

function normalizeTierViews(tiers: AIRouterTier[]): AIRouterTierView[] {
  if (tiers.length === 0) {
    return [
      {
        id: 'new-tier-0',
        order: 0,
        nodes: [],
      },
    ];
  }

  return [...tiers]
    .sort((a, b) => a.order - b.order)
    .map((tier) => ({
      id: tier.id,
      order: tier.order,
      nodes: [...tier.nodes].sort((a, b) => a.order - b.order),
    }));
}

function normalizeTiersForMutation(tiers: AIRouterTierDraft[]) {
  return tiers.map((tier, tierIndex) => ({
    order: tierIndex,
    nodes: tier.nodes
      .sort((a, b) => a.order - b.order)
      .map((node, nodeIndex) => ({
        gatewayId: node.gatewayId,
        provider: normalizeProvider(node.provider),
        order: nodeIndex,
        enabled: node.enabled,
        weight: normalizeWeight(node.weight),
        modelOverride: node.modelOverride?.trim() || null,
        timeoutMs: normalizeTimeoutMs(node.timeoutMs),
        retryableStatusCodes: normalizeRetryableStatusCodes(
          node.retryableStatusCodes
        ),
      })),
  }));
}

function normalizeWeight(value: number | string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 100;
  }

  return Math.min(100000, Math.max(0, Math.round(numericValue)));
}

function normalizeTimeoutMs(value: number | string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 30000;
  }

  return Math.min(300000, Math.max(1000, Math.round(numericValue)));
}

function normalizeProvider(
  value: string | null | undefined
): AIRouterProviderValue {
  return aiRouterProviderOptions.some((option) => option.value === value)
    ? (value as AIRouterProviderValue)
    : 'openai';
}

function formatProviderLabel(value: string | null | undefined) {
  return (
    aiRouterProviderOptions.find((option) => option.value === value)?.label ??
    'OpenAI'
  );
}

function normalizeRetryableStatusCodes(value: Array<number | string>) {
  return Array.from(
    new Set(
      value
        .map((code) => Math.round(Number(code)))
        .filter((code) => code >= 100 && code <= 599)
    )
  );
}

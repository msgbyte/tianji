import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from 'ahooks';
import {
  LuCheck,
  LuDollarSign,
  LuClock,
  LuZap,
  LuBrain,
  LuSettings,
  LuFile,
} from 'react-icons/lu';
import type { AIGatewayModelPricingCost } from './AIGatewayStrategyEditor.utils';

interface AIGatewayPricingSelection {
  provider: {
    id: string;
    name: string;
  };
  model: {
    id: string;
    name: string;
    cost?: AIGatewayModelPricingCost;
  };
}

interface AIGatewayPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPricing?: (selection: AIGatewayPricingSelection) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function normalizeModelPricingCost(
  cost: unknown
): AIGatewayModelPricingCost | undefined {
  if (!isRecord(cost)) {
    return undefined;
  }

  const normalized: AIGatewayModelPricingCost = {
    input: readNumber(cost.input),
    output: readNumber(cost.output),
    cache_read: readNumber(cost.cache_read),
    cache_write: readNumber(cost.cache_write),
  };

  if (isRecord(cost.context_over_200k)) {
    normalized.context_over_200k = {
      input: readNumber(cost.context_over_200k.input),
      output: readNumber(cost.context_over_200k.output),
      cache_read: readNumber(cost.context_over_200k.cache_read),
      cache_write: readNumber(cost.context_over_200k.cache_write),
    };
  }

  if (
    normalized.input === undefined &&
    normalized.output === undefined &&
    normalized.cache_read === undefined &&
    normalized.cache_write === undefined &&
    normalized.context_over_200k === undefined
  ) {
    return undefined;
  }

  return normalized;
}

export const AIGatewayPricingModal: React.FC<AIGatewayPricingModalProps> = ({
  isOpen,
  onClose,
  onSelectPricing,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 600 });

  const { data, isLoading, error } = trpc.aiGateway.modelPricing.useQuery({
    workspaceId,
    search: debouncedSearchTerm || undefined,
    limit: 50,
  });

  const formatPrice = (price: number) => {
    return `$${price.toFixed(4)}`;
  };

  const formatContext = (context: number) => {
    return context >= 1000000
      ? `${(context / 1000000).toFixed(1)}M`
      : context >= 1000
        ? `${(context / 1000).toFixed(0)}K`
        : context.toString();
  };

  const handleSelectPricing = (selection: AIGatewayPricingSelection) => {
    onSelectPricing?.(selection);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuDollarSign className="h-5 w-5" />
            {t('Model Pricing Information')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Browse and search AI model pricing, capabilities, and specifications'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center space-x-2 p-0.5">
            <Input
              placeholder={t('Search models by name or provider...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="flex h-32 items-center justify-center">
                <Loading />
              </div>
            )}

            {error && (
              <div className="flex h-32 items-center justify-center">
                <ErrorTip />
              </div>
            )}

            {data && (
              <div className="space-y-6">
                {data.providers.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-gray-500">
                    {t('No models found matching your search criteria')}
                  </div>
                ) : (
                  data.providers.map((provider) => (
                    <Card key={provider.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              className="h-6 w-6 rounded-sm bg-white p-0.5"
                              src={`https://models.dev/logos/${provider.id}.svg`}
                            />
                            <span>{provider.name}</span>
                          </div>
                          {provider.doc && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(provider.doc, '_blank')
                              }
                            >
                              {t('Documentation')}
                            </Button>
                          )}
                        </CardTitle>
                        {provider.api && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            API: {provider.api}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {provider.models.map((model) => {
                          const modelCost = normalizeModelPricingCost(
                            model.cost
                          );

                          return (
                            <div
                              key={model.id}
                              className="space-y-3 rounded-lg border p-4"
                            >
                              {/* Model Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-lg font-medium">
                                    {model.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {model.id}
                                  </p>
                                </div>
                                <div className="flex flex-wrap justify-end gap-1">
                                  {model.reasoning && (
                                    <Badge
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      <LuBrain className="h-3 w-3" />
                                      {t('Reasoning')}
                                    </Badge>
                                  )}
                                  {model.tool_call && (
                                    <Badge
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      <LuSettings className="h-3 w-3" />
                                      {t('Tool Call')}
                                    </Badge>
                                  )}
                                  {model.attachment && (
                                    <Badge
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      <LuFile className="h-3 w-3" />
                                      {t('Attachments')}
                                    </Badge>
                                  )}
                                  {modelCost?.context_over_200k && (
                                    <Badge variant="secondary">
                                      {t('200K+ Tier')}
                                    </Badge>
                                  )}
                                  {onSelectPricing && modelCost && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      Icon={LuCheck}
                                      onClick={() =>
                                        handleSelectPricing({
                                          provider: {
                                            id: provider.id,
                                            name: provider.name,
                                          },
                                          model: {
                                            id: model.id,
                                            name: model.name,
                                            cost: modelCost,
                                          },
                                        })
                                      }
                                    >
                                      {t('Apply')}
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Model Details Grid */}
                              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                {/* Pricing */}
                                {modelCost && (
                                  <div className="space-y-1">
                                    <p className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                      <LuDollarSign className="h-3 w-3" />
                                      {t('Pricing')}
                                    </p>
                                    {modelCost.input !== undefined && (
                                      <p className="text-xs">
                                        {t('Input')}:{' '}
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                          {formatPrice(modelCost.input)}
                                        </span>
                                        /1M tokens
                                      </p>
                                    )}
                                    {modelCost.output !== undefined && (
                                      <p className="text-xs">
                                        {t('Output')}:{' '}
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                          {formatPrice(modelCost.output)}
                                        </span>
                                        /1M tokens
                                      </p>
                                    )}
                                    {modelCost.cache_read !== undefined && (
                                      <p className="text-xs">
                                        {t('Cache Read')}:{' '}
                                        <span className="font-bold text-purple-600 dark:text-purple-400">
                                          {formatPrice(modelCost.cache_read)}
                                        </span>
                                        /1M tokens
                                      </p>
                                    )}
                                    {modelCost.cache_write !== undefined && (
                                      <p className="text-xs">
                                        {t('Cache Write')}:{' '}
                                        <span className="font-bold text-purple-600 dark:text-purple-400">
                                          {formatPrice(modelCost.cache_write)}
                                        </span>
                                        /1M tokens
                                      </p>
                                    )}
                                    {modelCost.context_over_200k && (
                                      <p className="text-muted-foreground text-xs">
                                        {t(
                                          'Has pricing above 200K input tokens'
                                        )}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Context & Output Limits */}
                                {model.limit && (
                                  <div className="space-y-1">
                                    <p className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                      <LuClock className="h-3 w-3" />
                                      {t('Limits')}
                                    </p>
                                    {model.limit.context && (
                                      <p className="text-xs">
                                        {t('Context')}:{' '}
                                        <span className="font-bold text-orange-600 dark:text-orange-400">
                                          {formatContext(model.limit.context)}
                                        </span>{' '}
                                        tokens
                                      </p>
                                    )}
                                    {model.limit.output && (
                                      <p className="text-xs">
                                        {t('Output')}:{' '}
                                        <span className="font-bold text-cyan-600 dark:text-cyan-400">
                                          {formatContext(model.limit.output)}
                                        </span>{' '}
                                        tokens
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Capabilities */}
                                <div className="space-y-1">
                                  <p className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                    <LuZap className="h-3 w-3" />
                                    {t('Capabilities')}
                                  </p>
                                  {model.modalities?.input && (
                                    <p className="text-xs">
                                      {t('Input')}:{' '}
                                      {model.modalities.input.join(', ')}
                                    </p>
                                  )}
                                  {model.modalities?.output && (
                                    <p className="text-xs">
                                      {t('Output')}:{' '}
                                      {model.modalities.output.join(', ')}
                                    </p>
                                  )}
                                  {model.temperature && (
                                    <p className="text-xs">
                                      {t('Temperature Support')}
                                    </p>
                                  )}
                                </div>

                                {/* Additional Info */}
                                <div className="space-y-1">
                                  <p className="font-medium text-gray-700 dark:text-gray-300">
                                    {t('Info')}
                                  </p>
                                  {model.knowledge && (
                                    <p className="text-xs">
                                      {t('Knowledge')}:{' '}
                                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                        {model.knowledge}
                                      </span>
                                    </p>
                                  )}
                                  {model.release_date && (
                                    <p className="text-xs">
                                      {t('Released')}:{' '}
                                      <span className="font-bold text-gray-700 dark:text-gray-300">
                                        {model.release_date}
                                      </span>
                                    </p>
                                  )}
                                  {model.open_weights !== undefined && (
                                    <p className="text-xs">
                                      {model.open_weights
                                        ? t('Open Weights')
                                        : t('Closed Source')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

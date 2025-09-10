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
  LuDollarSign,
  LuClock,
  LuZap,
  LuBrain,
  LuSettings,
  LuFile,
} from 'react-icons/lu';

interface AIGatewayPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIGatewayPricingModal: React.FC<AIGatewayPricingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 600 });

  const { data, isLoading, error } = trpc.aiGateway.modelPricing.useQuery({
    workspaceId,
    search: debouncedSearchTerm || undefined,
    limit: 10,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                        {provider.models.map((model) => (
                          <div
                            key={model.id}
                            className="space-y-3 rounded-lg border p-4"
                          >
                            {/* Model Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-lg font-medium">
                                  {model.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {model.id}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1">
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
                              </div>
                            </div>

                            {/* Model Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                              {/* Pricing */}
                              {model.cost && (
                                <div className="space-y-1">
                                  <p className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                    <LuDollarSign className="h-3 w-3" />
                                    {t('Pricing')}
                                  </p>
                                  {model.cost.input !== undefined && (
                                    <p className="text-xs">
                                      {t('Input')}:{' '}
                                      <span className="font-bold text-green-600 dark:text-green-400">
                                        {formatPrice(model.cost.input)}
                                      </span>
                                      /1M tokens
                                    </p>
                                  )}
                                  {model.cost.output !== undefined && (
                                    <p className="text-xs">
                                      {t('Output')}:{' '}
                                      <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {formatPrice(model.cost.output)}
                                      </span>
                                      /1M tokens
                                    </p>
                                  )}
                                  {model.cost.cache_read !== undefined && (
                                    <p className="text-xs">
                                      {t('Cache Read')}:{' '}
                                      <span className="font-bold text-purple-600 dark:text-purple-400">
                                        {formatPrice(model.cost.cache_read)}
                                      </span>
                                      /1M tokens
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
                        ))}
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

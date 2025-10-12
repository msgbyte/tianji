import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  UrlParamsInput,
  getQueryString,
  type UrlParam,
} from '@/components/worker/UrlParamsInput';
import { cn } from '@/utils/style';
import { toast } from 'sonner';
import { LuCopy, LuExternalLink, LuPlay } from 'react-icons/lu';

type WorkerApiPreviewVariant = 'card' | 'split';

export interface WorkerApiPreviewProps {
  workspaceId: string;
  workerId: string;
  isActive: boolean;
  disabled?: boolean;
  className?: string;
  initialParams?: UrlParam[];
  params?: UrlParam[];
  onParamsChange?: (params: UrlParam[]) => void;
  onExecute?: () => void;
  onCopyUrl?: (url: string) => void;
  onOpenNewWindow?: (url: string) => void;
  onPreviewLoaded?: () => void;
  variant?: WorkerApiPreviewVariant;
}

export const WorkerApiPreview: React.FC<WorkerApiPreviewProps> = ({
  workspaceId,
  workerId,
  isActive,
  disabled,
  className,
  initialParams,
  params: controlledParams,
  onParamsChange,
  onExecute,
  onCopyUrl,
  onOpenNewWindow,
  onPreviewLoaded,
  variant = 'card',
}) => {
  const { t } = useTranslation();

  const isControlled = Array.isArray(controlledParams);

  const [params, setParams] = useState<UrlParam[]>(() => {
    if (controlledParams && controlledParams.length > 0) {
      return [...controlledParams];
    }

    if (initialParams && initialParams.length > 0) {
      return [...initialParams];
    }

    return [{ key: '', value: '' }];
  });

  const [activeParams, setActiveParams] = useState<UrlParam[]>(() => {
    if (controlledParams && controlledParams.length > 0) {
      return [...controlledParams];
    }

    if (initialParams && initialParams.length > 0) {
      return [...initialParams];
    }

    return [{ key: '', value: '' }];
  });
  const [previewKey, setPreviewKey] = useState(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (controlledParams) {
      setParams(
        controlledParams.length > 0
          ? [...controlledParams]
          : [{ key: '', value: '' }]
      );
    }
  }, [controlledParams]);

  const basePreviewUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}/api/worker/${workspaceId}/${workerId}`;
  }, [workspaceId, workerId]);

  const handleParamsChange = useCallback(
    (nextParams: UrlParam[]) => {
      const normalized =
        nextParams.length > 0 ? nextParams : [{ key: '', value: '' }];

      if (!isControlled) {
        setParams(normalized);
      }

      onParamsChange?.(normalized);
    },
    [isControlled, onParamsChange]
  );

  const handleCopyUrl = useCallback(async () => {
    if (!basePreviewUrl) {
      return;
    }

    const queryString = getQueryString(params);
    const url = queryString
      ? `${basePreviewUrl}?${queryString}`
      : basePreviewUrl;

    try {
      if (onCopyUrl) {
        onCopyUrl(url);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success(t('API endpoint URL copied to clipboard'));
    } catch (error) {
      toast.error(t('Failed to copy URL'));
    }
  }, [basePreviewUrl, onCopyUrl, params, t]);

  const handleOpenInNewWindow = useCallback(() => {
    if (!basePreviewUrl) {
      return;
    }

    const queryString = getQueryString(params);
    const url = queryString
      ? `${basePreviewUrl}?${queryString}`
      : basePreviewUrl;
    if (onOpenNewWindow) {
      onOpenNewWindow(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [basePreviewUrl, onOpenNewWindow, params]);

  const handleExecutePreview = useCallback(() => {
    if (!basePreviewUrl) {
      return;
    }

    setActiveParams(params.length > 0 ? params : [{ key: '', value: '' }]);
    setIsLoadingPreview(true);
    setPreviewKey((prev) => prev + 1);
    onExecute?.();
  }, [basePreviewUrl, onExecute, params]);

  const handlePreviewLoad = useCallback(() => {
    setIsLoadingPreview(false);
    onPreviewLoaded?.();
  }, []);

  const previewSrc = useMemo(() => {
    if (!basePreviewUrl) {
      return undefined;
    }

    const queryString = getQueryString(activeParams);
    return queryString ? `${basePreviewUrl}?${queryString}` : basePreviewUrl;
  }, [activeParams, basePreviewUrl]);

  const hasPreview = previewKey > 0;
  const copyDisabled = !basePreviewUrl;
  const openDisabled = !isActive || !basePreviewUrl;
  const executeDisabled = !isActive || !basePreviewUrl || disabled;

  const renderActionButtons = () => (
    <div className="flex items-center gap-2">
      <SimpleTooltip content={t('Copy API URL')}>
        <Button
          variant="outline"
          size="icon"
          Icon={LuCopy}
          className="h-8 w-8"
          onClick={handleCopyUrl}
          disabled={copyDisabled}
        />
      </SimpleTooltip>
      <SimpleTooltip content={t('Open in New Window')}>
        <Button
          variant="outline"
          size="icon"
          Icon={LuExternalLink}
          className="h-8 w-8"
          onClick={handleOpenInNewWindow}
          disabled={openDisabled}
        />
      </SimpleTooltip>
      <SimpleTooltip content={t('Execute Preview')}>
        <Button
          variant="outline"
          size="icon"
          Icon={LuPlay}
          className="h-8 w-8"
          onClick={handleExecutePreview}
          loading={isLoadingPreview}
          disabled={executeDisabled}
        />
      </SimpleTooltip>
    </div>
  );

  const renderPreviewFrame = (containerClassName: string) => (
    <div className={containerClassName}>
      {hasPreview && previewSrc ? (
        <iframe
          key={`${previewKey}-${previewSrc}`}
          src={previewSrc}
          className="h-full w-full rounded-md"
          title="Worker Preview"
          sandbox="allow-same-origin allow-scripts"
          onLoad={handlePreviewLoad}
        />
      ) : null}

      {isLoadingPreview && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-md backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-sm">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2" />
            <span>{t('Loading...')}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderPlaceholder = (
    placeholderClassName: string,
    description: string
  ) => (
    <div className={placeholderClassName}>
      <div className="space-y-2 text-center">
        <LuPlay className="mx-auto h-12 w-12" />
        <p>{description}</p>
        {!isActive && (
          <p className="text-xs text-orange-500">
            {t('Worker must be active to preview')}
          </p>
        )}
      </div>
    </div>
  );

  if (variant === 'split') {
    return (
      <div
        className={cn(
          'bg-muted/40 flex h-full flex-col border-t px-4 py-3',
          className
        )}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {t('Execution Preview')}
            </span>
            <span className="text-muted-foreground text-xs">
              {t('Test API endpoint with custom query parameters')}
            </span>
          </div>
          {renderActionButtons()}
        </div>

        <div className="mt-3 grid flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="bg-background rounded-md border p-3">
            <UrlParamsInput params={params} onChange={handleParamsChange} />
          </div>
          <div className="bg-background relative min-h-[200px] rounded-md border">
            {hasPreview && previewSrc
              ? renderPreviewFrame(
                  'absolute inset-0 h-full w-full rounded-md bg-white'
                )
              : renderPlaceholder(
                  'text-muted-foreground flex h-full flex-col items-center justify-center space-y-2 text-center text-sm',
                  t(
                    'Configure parameters and execute preview to see live response'
                  )
                )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t('Preview')}</CardTitle>
        {renderActionButtons()}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <UrlParamsInput params={params} onChange={handleParamsChange} />

        {hasPreview && previewSrc ? (
          <div className="flex h-full flex-1 flex-col space-y-4">
            <p className="text-muted-foreground text-sm">
              {t('Live preview of the worker API endpoint:')}
            </p>
            {renderPreviewFrame(
              'relative h-full flex-1 rounded-md border bg-white'
            )}
          </div>
        ) : (
          renderPlaceholder(
            'text-muted-foreground flex h-[400px] items-center justify-center text-sm',
            t('Click "Execute Preview" to see the live result')
          )
        )}
      </CardContent>
    </Card>
  );
};

WorkerApiPreview.displayName = 'WorkerApiPreview';

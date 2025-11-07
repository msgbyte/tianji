import React, { useCallback } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LuX } from 'react-icons/lu';
import qs from 'qs';
import { useEvent } from '@/hooks/useEvent';

export interface UrlParam {
  key: string;
  value: string;
}

interface UrlParamsInputProps {
  params: UrlParam[];
  onChange: (params: UrlParam[]) => void;
  className?: string;
}

export const UrlParamsInput: React.FC<UrlParamsInputProps> = ({
  params,
  onChange,
  className = '',
}) => {
  const { t } = useTranslation();

  // Helper function to remove parameter row
  const removeParamRow = useEvent((index: number) => {
    onChange(params.filter((_, i) => i !== index));
  });

  // Helper function to update parameter
  const updateParam = useEvent(
    (index: number, field: 'key' | 'value', value: string) => {
      const newParams = params.map((param, i) =>
        i === index ? { ...param, [field]: value } : param
      );

      // Check if we need to auto-add a new row
      let shouldAddNewRow = false;

      // Only auto-add if this is the last row and both key and value are filled
      if (index === params.length - 1) {
        const currentParam = newParams[index];
        const isKeyField = field === 'key';
        const otherField = isKeyField ? 'value' : 'key';

        // Check if both fields are now filled
        if (isKeyField && value.trim() !== '') {
          // Only add new row if we're adding content (not deleting)
          shouldAddNewRow = true;
        }
      }

      // Update params first
      onChange(newParams);

      // Then add new row if needed
      if (shouldAddNewRow) {
        onChange([...newParams, { key: '', value: '' }]);
      }
    }
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center">
        <Label className="text-sm font-medium">{t('URL Parameters')}</Label>
      </div>
      <div className="max-h-[200px] space-y-2 overflow-y-auto p-0.5">
        {params.map((param, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              placeholder={t('Key')}
              value={param.key}
              onChange={(e) => updateParam(index, 'key', e.target.value)}
              className="flex-1 text-sm"
            />
            <Input
              placeholder={t('Value')}
              value={param.value}
              onChange={(e) => updateParam(index, 'value', e.target.value)}
              className="flex-1 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeParamRow(index)}
              className="h-8 w-8 p-0"
              disabled={params.length === 1}
            >
              <LuX className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        {t('Add key-value pairs to append as query parameters')}
      </p>
    </div>
  );
};

export function getQueryString(params: UrlParam[]): string {
  const validParams = params.filter((p) => p.key.trim() && p.value.trim());
  if (validParams.length === 0) return '';

  // Convert array of {key, value} objects to a plain object
  const queryObject = validParams.reduce(
    (acc, param) => {
      acc[param.key.trim()] = param.value.trim();
      return acc;
    },
    {} as Record<string, string>
  );

  return qs.stringify(queryObject);
}

export function getPayloadFromParams(params: UrlParam[]): Record<string, any> {
  const payload: Record<string, any> = {};

  params.forEach((param) => {
    if (param.key && param.key.trim() !== '') {
      payload[param.key] = param.value;
    }
  });

  return payload;
}

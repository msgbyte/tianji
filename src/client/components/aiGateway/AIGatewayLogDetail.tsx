import { AppRouterOutput } from '@/api/trpc';
import { useTranslation } from '@i18next-toolkit/react';
import dayjs from 'dayjs';
import React from 'react';
import { CodeBlock } from '../CodeBlock';
import { SheetDataSection } from '../ui/sheet';
import { AIGatewayStatus } from './AIGatewayStatus';

export type AIGatewayLogItem =
  AppRouterOutput['aiGateway']['logs']['items'][number];

interface AIGatewayLogDetailProps {
  item: AIGatewayLogItem;
}

export const AIGatewayLogDetail: React.FC<AIGatewayLogDetailProps> =
  React.memo(({ item }) => {
    const { t } = useTranslation();

    return (
      <div>
        <SheetDataSection label="ID">{item.id}</SheetDataSection>
        <SheetDataSection label={t('Statue')}>
          <AIGatewayStatus status={item.status} />
        </SheetDataSection>

        <SheetDataSection label={t('Model')}>
          {item.modelName ?? <span className="opacity-40">(null)</span>}
        </SheetDataSection>

        <SheetDataSection label={t('User')}>
          {item.userId ?? <span className="opacity-40">-</span>}
        </SheetDataSection>

        <SheetDataSection label={t('Created At')}>
          {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </SheetDataSection>

        <SheetDataSection label={t('Price')}>
          <span className="mr-1 opacity-60">$</span>
          {item.price}
        </SheetDataSection>

        <SheetDataSection label={t('Duration')}>
          {item.duration} ms
        </SheetDataSection>

        <SheetDataSection label="TTFT">
          {renderNullableTiming(item.ttft, 'ms')}
        </SheetDataSection>

        <SheetDataSection label="TPOT">
          {renderNullableTiming(item.tpot, 'ms/token')}
        </SheetDataSection>

        <SheetDataSection label="Output TPS">
          {renderOutputTpsText(item.tpot)}
        </SheetDataSection>

        <SheetDataSection label="Tokens">
          {item.inputToken}↑ | {item.outputToken}↓
          {item.cacheReadInputToken > 0 && (
            <> | {item.cacheReadInputToken} cache read</>
          )}
          {item.cacheWriteInputToken > 0 && (
            <> | {item.cacheWriteInputToken} cache write</>
          )}
        </SheetDataSection>

        <SheetDataSection label={t('Request Payload')}>
          {renderJsonData(item.requestPayload)}
        </SheetDataSection>

        <SheetDataSection label={t('Response Payload')}>
          {renderJsonData(item.responsePayload)}
        </SheetDataSection>
      </div>
    );
  });

AIGatewayLogDetail.displayName = 'AIGatewayLogDetail';

function renderJsonData(data: any) {
  try {
    return <CodeBlock code={JSON.stringify(data, null, 2)} />;
  } catch (err) {
    return <div className="text-red-500">{String(err)}</div>;
  }
}

function renderNullableTiming(value: number, suffix: string) {
  if (value === -1) {
    return <span className="opacity-40">(null)</span>;
  }

  return `${value} ${suffix}`;
}

function renderOutputTpsText(tpot: number) {
  if (tpot <= 0) {
    return <span className="opacity-40">(null)</span>;
  }

  return `${(1000 / tpot).toFixed(2)} token/s`;
}

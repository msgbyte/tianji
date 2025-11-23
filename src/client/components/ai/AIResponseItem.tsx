import {
  AbstractChat,
  ChatStatus,
  ToolUIPart,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UITools,
} from 'ai';
import React from 'react';
import { Response } from '../ai-elements/response';
import { Button } from '../ui/button';
import { useTranslation } from '@i18next-toolkit/react';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '../ai-elements/tool';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '../ai-elements/reasoning';
import { get, map } from 'lodash-es';
import { SimpleVirtualList } from '../SimpleVirtualList';
import { globalEventBus } from '@/utils/event';

type AskForConfirmationInput = { message: string };

function isAskForConfirmationInput(
  input: unknown
): input is AskForConfirmationInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof (input as any).message === 'string'
  );
}

interface AIResponseItemProps {
  message: UIMessage<unknown, UIDataTypes, UITools>;
  part: UIMessagePart<UIDataTypes, UITools>;
  status: ChatStatus;
  onAddToolResult: (
    result: Parameters<AbstractChat<UIMessage>['addToolResult']>[0]
  ) => void;
}
export const AIResponseItem: React.FC<AIResponseItemProps> = React.memo(
  (props) => {
    const { message, part, status, onAddToolResult } = props;
    const { t } = useTranslation();

    if (part.type === 'text') {
      return <Response>{part.text}</Response>;
    }

    if (part.type === 'reasoning') {
      return (
        <Reasoning
          key={`${message.id}`}
          className="w-full"
          isStreaming={status === 'streaming'}
        >
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      );
    }

    if (part.type === 'tool-askForConfirmation') {
      const callId = part.toolCallId;

      if (part.state === 'input-streaming') {
        return <div key={callId}>Loading confirmation request...</div>;
      } else if (part.state === 'input-available') {
        return (
          <div key={callId}>
            {isAskForConfirmationInput(part.input) ? part.input.message : null}
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  onAddToolResult({
                    tool: 'askForConfirmation',
                    toolCallId: callId,
                    output: 'Yes, confirmed.',
                  })
                }
              >
                {t('Confirm')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onAddToolResult({
                    tool: 'askForConfirmation',
                    toolCallId: callId,
                    output: 'No, denied',
                  })
                }
              >
                {t('Deny')}
              </Button>
            </div>
          </div>
        );
      } else if (part.state === 'output-available') {
        return (
          <div key={callId}>Location access allowed: {String(part.output)}</div>
        );
      } else if (part.state === 'output-error') {
        return <div key={callId}>Error: {String(part.errorText)}</div>;
      }
    }

    if (part.type === 'tool-getLocation') {
      return (
        <Tool key={part.toolCallId} defaultOpen={false}>
          <ToolHeader type={part.type} state={part.state} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput
              output={<Response>{String(part.output)}</Response>}
              errorText={part.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }

    if (part.type === 'tool-getWeatherInformation') {
      return (
        <Tool key={part.toolCallId} defaultOpen={false}>
          <ToolHeader type={part.type} state={part.state} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput
              output={<Response>{String(part.output)}</Response>}
              errorText={part.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }

    if (part.type === 'tool-getWarehouseTables') {
      return (
        <Tool key={part.toolCallId} defaultOpen={false}>
          <ToolHeader type={part.type} state={part.state} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput
              output={
                <Response>
                  {map(part.output as any, (item) =>
                    get(item, 'tableName')
                  ).join('\n')}
                </Response>
              }
              errorText={part.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }

    if (part.type === 'tool-getWarehouseTable') {
      return (
        <Tool key={part.toolCallId} defaultOpen={false}>
          <ToolHeader type={part.type} state={part.state} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput
              output={<Response>{JSON.stringify(part.output)}</Response>}
              errorText={part.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }

    if (part.type === 'tool-queryWarehouse') {
      const input = part.input as any;
      const output = get(part, 'output.data', part.output);
      const available = part.state === 'output-available';

      return (
        <>
          <Tool
            key={part.toolCallId}
            defaultOpen={false}
            className="w-full overflow-hidden"
          >
            <ToolHeader type={part.type} state={part.state} />
            <ToolContent>
              <ToolInput input={part.input} />
              <ToolOutput
                className="max-h-80 overflow-auto"
                output={
                  Array.isArray(output) ? (
                    <SimpleVirtualList
                      estimateSize={16}
                      allData={output}
                      renderItem={(item) => (
                        <div className="text-nowrap">
                          {JSON.stringify(item)}
                        </div>
                      )}
                    />
                  ) : (
                    <Response>{JSON.stringify(output)}</Response>
                  )
                }
                errorText={part.errorText}
              />
            </ToolContent>
          </Tool>
          {available && (
            <div>
              <Button
                size="sm"
                onClick={() => {
                  globalEventBus.emit(
                    'createInsightChartBlock',
                    input.title ?? 'Chart',
                    {
                      rawData: output as any[],
                      groups: input.groups,
                      metrics: input.metrics,
                      time: {
                        ...input.time,
                        ...(part.output as any).time,
                      },
                      chartType: input.chartType,
                    }
                  );
                }}
              >
                {t('Create Chart')}
              </Button>
            </div>
          )}
        </>
      );
    }

    if (part.type === 'tool-createCharts') {
      return (
        <Tool key={part.toolCallId} defaultOpen={false}>
          <ToolHeader type={part.type} state={part.state} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput
              output={<Response>{JSON.stringify(part.output)}</Response>}
              errorText={part.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }

    if (part.type.startsWith('tool-')) {
      const toolPart = part as ToolUIPart;
      return (
        <Tool key={toolPart.toolCallId} defaultOpen={false}>
          <ToolHeader type={toolPart.type} state={toolPart.state} />
          <ToolContent>
            <ToolInput input={toolPart.input} />
            <ToolOutput
              output={<Response>{JSON.stringify(toolPart.output)}</Response>}
              errorText={toolPart.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }

    return null;
  }
);
AIResponseItem.displayName = 'AIResponseItem';

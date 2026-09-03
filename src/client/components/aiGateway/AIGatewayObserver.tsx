import { trpc } from '@/api/trpc';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useCurrentWorkspaceId } from '@/store/user';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Link, useNavigate } from '@tanstack/react-router';
import { t } from '@i18next-toolkit/react';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  LuArrowLeft,
  LuBraces,
  LuCheck,
  LuCopy,
  LuPause,
  LuPlay,
  LuSearch,
  LuTrash2,
  LuWrench,
} from 'react-icons/lu';
import type { AIGatewayLogItem } from './AIGatewayLogDetail';
import './AIGatewayObserver.css';

type StatusFilter = 'All' | 'Success' | 'Failed' | 'Pending';
type DetailTab = 'conversation' | 'input' | 'output' | 'raw';
type AnyRecord = Record<string, any>;

interface DisplayToolCall {
  id?: string;
  name: string;
  args: unknown;
}

interface DisplayMessage {
  role: string;
  name?: string;
  content: string;
  toolCalls: DisplayToolCall[];
}

const statusFilters: StatusFilter[] = ['All', 'Success', 'Failed', 'Pending'];

export function AIGatewayObserver({ gatewayId }: { gatewayId: string }) {
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const compact = width <= 1080;
  const [live, setLive] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [openedAt, setOpenedAt] = useState(() => new Date());
  const [cursor, setCursor] = useState<string>();
  const [sessionLogs, setSessionLogs] = useState<Map<string, AIGatewayLogItem>>(
    () => new Map()
  );
  const pendingIds = useMemo(
    () =>
      Array.from(sessionLogs.values())
        .filter((log) => log.status === 'Pending')
        .map((log) => log.id),
    [sessionLogs]
  );

  const { data: gateways = [] } = trpc.aiGateway.all.useQuery({ workspaceId });
  const { data, error, isLoading, isFetching } = trpc.aiGateway.logs.useQuery(
    { workspaceId, gatewayId, limit: 100, openedAt, cursor, pendingIds },
    {
      enabled: live,
      refetchInterval: live ? 2000 : false,
      refetchIntervalInBackground: true,
    }
  );

  useEffect(() => {
    if (!data || data.items.some((log) => log.gatewayId !== gatewayId)) {
      return;
    }

    if (data.items.length) {
      setSessionLogs((current) => {
        const next = new Map(current);
        data.items.forEach((log) => next.set(log.id, log));
        return next;
      });
    }
    if (data.nextCursor && data.nextCursor !== cursor) {
      setCursor(data.nextCursor);
    }
  }, [cursor, data, gatewayId]);

  const logs = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return Array.from(sessionLogs.values())
      .filter((log) => {
        if (filter !== 'All' && log.status !== filter) {
          return false;
        }

        if (!needle) {
          return true;
        }

        return [
          log.id,
          log.modelName,
          log.modelProvider,
          log.userId,
          getPromptPreview(log),
        ].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(needle)
        );
      })
      .sort((left, right) => {
        const createdAt =
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime();
        return createdAt || right.id.localeCompare(left.id);
      });
  }, [filter, search, sessionLogs]);

  const selectedLog = logs.find((log) => log.id === selectedId) ?? logs[0];
  const gatewayName =
    gateways.find((gateway) => gateway.id === gatewayId)?.name ?? gatewayId;
  const completed = logs.filter((log) => log.status !== 'Pending');
  const successRate = completed.length
    ? `${Math.round((completed.filter((log) => log.status === 'Success').length / completed.length) * 100)}%`
    : '—';
  const p95 = percentile95(logs.map((log) => log.duration).filter(Boolean));

  const clearView = () => {
    setOpenedAt(new Date());
    setCursor(undefined);
    setSessionLogs(new Map());
    setSelectedId(undefined);
  };

  return (
    <main className="gateway-observer">
      <header className="observer-toolbar">
        <Link
          to="/aiGateway/$gatewayId"
          params={{ gatewayId }}
          className="observer-brand"
          aria-label={t('Back to AI Gateway')}
        >
          <LuArrowLeft />
          <span className="observer-mark">{t('AI')}</span>
          <strong>{t('Gateway Log Observer')}</strong>
        </Link>

        <select
          aria-label={t('Select Gateway')}
          className="observer-select"
          value={gatewayId}
          onChange={(event) =>
            navigate({
              to: '/aiGateway/$gatewayId/observer',
              params: { gatewayId: event.target.value },
            })
          }
        >
          {gateways.map((gateway) => (
            <option key={gateway.id} value={gateway.id}>
              {gateway.name}
            </option>
          ))}
          {gateways.length === 0 && (
            <option value={gatewayId}>{gatewayId}</option>
          )}
        </select>

        <div className="observer-status-filter" aria-label={t('Status filter')}>
          {statusFilters.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>

        <label className="observer-search">
          <LuSearch />
          <span className="sr-only">{t('Search logs')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search requests, models, or users')}
          />
        </label>

        <button
          type="button"
          className="observer-icon-button"
          onClick={clearView}
          title={t('Clear current view')}
          aria-label={t('Clear current view')}
        >
          <LuTrash2 />
        </button>

        <button
          type="button"
          className={`observer-live${live ? ' is-live' : ''}`}
          aria-pressed={live}
          onClick={() => setLive((value) => !value)}
        >
          {live ? <LuPause /> : <LuPlay />}
          <span className="observer-live-dot" />
          {live ? t('Live') : t('Paused')}
        </button>
      </header>

      <section className="observer-body">
        <ResizablePanelGroup direction={compact ? 'vertical' : 'horizontal'}>
          <ResizablePanel defaultSize={compact ? 48 : 62} minSize={25}>
            <LogStream
              logs={logs}
              selectedId={selectedLog?.id}
              isLoading={isLoading}
              error={error?.message}
              onSelect={setSelectedId}
            />
          </ResizablePanel>
          <ResizableHandle className="observer-resize" withHandle />
          <ResizablePanel defaultSize={compact ? 52 : 38} minSize={25}>
            <LogDetail log={selectedLog} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </section>

      <footer className="observer-statusbar">
        <span>
          <i className={live ? 'is-live' : ''} />
          {live
            ? isFetching
              ? t('Syncing')
              : t('Live connection')
            : t('Paused')}
        </span>
        <span>
          {t('Showing')} <b>{logs.length}</b>
        </span>
        <span>
          {t('Success rate')} <b>{successRate}</b>
        </span>
        <span>
          {t('P95')} <b>{p95 ? `${formatDuration(p95)}` : '—'}</b>
        </span>
        <span className="observer-statusbar-end">
          {gatewayName} · {t('Refreshes every 2 seconds')}
        </span>
      </footer>
    </main>
  );
}

function LogStream({
  logs,
  selectedId,
  isLoading,
  error,
  onSelect,
}: {
  logs: AIGatewayLogItem[];
  selectedId?: string;
  isLoading: boolean;
  error?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="observer-stream">
      <div className="observer-stream-title">
        <span>{t('Request stream')}</span>
        <span>{t('{{count}} requests', { count: logs.length })}</span>
      </div>
      <div className="observer-table-wrap">
        <table className="observer-table">
          <thead>
            <tr>
              <th>{t('Status')}</th>
              <th>{t('Latency')}</th>
              <th>{t('Model / Request')}</th>
              <th>{t('Tokens')}</th>
              <th>{t('TTFT')}</th>
              <th>{t('Cost')}</th>
              <th>{t('Time')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                tabIndex={0}
                aria-selected={selectedId === log.id}
                onClick={() => onSelect(log.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(log.id);
                  }
                }}
              >
                <td>
                  <StatusPill status={log.status} compact />
                </td>
                <td
                  className={
                    log.duration >= 8000
                      ? 'is-error'
                      : log.duration >= 4000
                        ? 'is-warn'
                        : ''
                  }
                >
                  {log.status === 'Pending'
                    ? '—'
                    : formatDuration(log.duration)}
                </td>
                <td>
                  <strong>{log.modelName}</strong>
                  <span>{getPromptPreview(log)}</span>
                </td>
                <td>
                  {formatNumber(log.inputToken)} →{' '}
                  {formatNumber(log.outputToken)}
                </td>
                <td>{log.ttft >= 0 ? `${log.ttft}ms` : '—'}</td>
                <td>
                  {log.status === 'Pending' ? '—' : `$${log.price.toFixed(5)}`}
                </td>
                <td>{dayjs(log.createdAt).format('HH:mm:ss.SSS')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && (
          <div className="observer-empty">
            <LuBraces />
            <strong>
              {isLoading
                ? t('Reading logs…')
                : error
                  ? t('Failed to read logs')
                  : t('Waiting for requests')}
            </strong>
            <span>
              {error ?? t('New Gateway requests will appear here in real time')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LogDetail({ log }: { log?: AIGatewayLogItem }) {
  const [tab, setTab] = useState<DetailTab>('conversation');

  if (!log) {
    return (
      <aside className="observer-detail observer-detail-empty">
        <LuBraces />
        <strong>{t('Select a request')}</strong>
        <span>
          {t('Conversations, tool calls, and raw payloads will appear here')}
        </span>
      </aside>
    );
  }

  const requestMessages = getRequestMessages(log.requestPayload);
  const responseMessages = getResponseMessages(log.responsePayload);
  const error = getResponseError(log.responsePayload);

  return (
    <aside className="observer-detail">
      <div className="observer-detail-head">
        <div>
          <span className="observer-log-id">{log.id}</span>
          <h1>{log.modelName}</h1>
          <p>
            {log.modelProvider} ·{' '}
            {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss.SSS')}
          </p>
        </div>
        <StatusPill status={log.status} />
      </div>

      <div className="observer-meta-strip">
        <Meta
          label={t('Latency')}
          value={log.status === 'Pending' ? '—' : formatDuration(log.duration)}
        />
        <Meta
          label={t('Tokens')}
          value={`${formatNumber(log.inputToken)} → ${formatNumber(log.outputToken)}`}
        />
        <Meta label={t('Stream')} value={String(log.stream)} />
        <Meta
          label={t('Cost')}
          value={log.status === 'Pending' ? '—' : `$${log.price.toFixed(5)}`}
        />
      </div>

      <details className="observer-meta-fold">
        <summary>{t('Metadata and timing')}</summary>
        <dl>
          <MetaRow label={t('Workspace ID')} value={log.workspaceId} />
          <MetaRow label={t('Gateway ID')} value={log.gatewayId} />
          <MetaRow label={t('User ID')} value={log.userId ?? '—'} />
          <MetaRow
            label={t('TTFT')}
            value={log.ttft >= 0 ? `${log.ttft} ms` : '—'}
          />
          <MetaRow
            label={t('TPOT')}
            value={log.tpot >= 0 ? `${log.tpot.toFixed(2)} ms/tok` : '—'}
          />
          <MetaRow
            label={t('Output TPS')}
            value={log.tpot > 0 ? `${(1000 / log.tpot).toFixed(1)} tok/s` : '—'}
          />
          <MetaRow
            label={t('Cache read / write')}
            value={`${formatNumber(log.cacheReadInputToken)} / ${formatNumber(log.cacheWriteInputToken)}`}
          />
        </dl>
      </details>

      <div className="observer-detail-tabs">
        <div>
          <strong>{t('Content')}</strong>
          <span>
            {t('{{count}} messages', {
              count: requestMessages.length + responseMessages.length,
            })}
          </span>
        </div>
        <div role="tablist" aria-label={t('Content view')}>
          {(['conversation', 'input', 'output', 'raw'] as DetailTab[]).map(
            (value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
              >
                {value === 'conversation'
                  ? t('Conversation')
                  : value === 'input'
                    ? t('Input')
                    : value === 'output'
                      ? t('Output')
                      : t('Raw')}
              </button>
            )
          )}
        </div>
      </div>

      <div className="observer-tab-panel" role="tabpanel">
        {tab === 'conversation' && (
          <MessageList
            messages={[...requestMessages, ...responseMessages]}
            pending={log.status === 'Pending'}
            error={
              log.status === 'Failed'
                ? error ||
                  t(
                    'The upstream model returned an error and the request did not complete.'
                  )
                : undefined
            }
          />
        )}
        {tab === 'input' && <InputView log={log} messages={requestMessages} />}
        {tab === 'output' && (
          <OutputView log={log} messages={responseMessages} error={error} />
        )}
        {tab === 'raw' && (
          <div className="observer-raw-view">
            <JsonViewer
              label={t('Request payload')}
              value={log.requestPayload}
            />
            <JsonViewer
              label={t('Response payload')}
              value={log.responsePayload}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

function InputView({
  log,
  messages,
}: {
  log: AIGatewayLogItem;
  messages: DisplayMessage[];
}) {
  const request = asRecord(log.requestPayload) ?? {};
  const tools = Array.isArray(request.tools) ? request.tools : [];
  const params = [
    [t('Model'), request.model ?? log.modelName],
    [t('Temperature'), request.temperature],
    [t('Max tokens'), request.max_tokens ?? request.max_output_tokens],
    [t('Stream'), request.stream ?? log.stream],
    [t('Tool choice'), request.tool_choice],
  ].filter(([, value]) => value !== undefined);

  return (
    <div className="observer-input-view">
      <div className="observer-params">
        {params.map(([label, value]) => (
          <Meta
            key={String(label)}
            label={String(label)}
            value={String(value)}
          />
        ))}
      </div>
      {tools.length > 0 && (
        <div className="observer-tools">
          <span>
            {t('Available tools')} · {tools.length}
          </span>
          {tools.map((tool, index) => {
            const fn = asRecord(asRecord(tool)?.function) ?? asRecord(tool);
            const name = String(fn?.name ?? t('Tool'));
            return (
              <b key={`${name}-${index}`}>
                <LuWrench />
                {name}
              </b>
            );
          })}
        </div>
      )}
      <MessageList messages={messages} />
    </div>
  );
}

function OutputView({
  log,
  messages,
  error,
}: {
  log: AIGatewayLogItem;
  messages: DisplayMessage[];
  error?: string;
}) {
  const response = asRecord(log.responsePayload) ?? {};
  const nested = asRecord(response.response) ?? response;
  const choice = Array.isArray(nested.choices)
    ? asRecord(nested.choices[0])
    : null;
  const usage = asRecord(response.usage) ?? asRecord(nested.usage);

  if (log.status === 'Pending') {
    return <MessageList messages={[]} pending />;
  }

  if (log.status === 'Failed') {
    return (
      <MessageList
        messages={[]}
        error={
          error ||
          t(
            'The upstream model returned an error and the request did not complete.'
          )
        }
      />
    );
  }

  return (
    <div className="observer-output-view">
      <div className="observer-response-meta">
        <Meta label={t('ID')} value={String(nested.id ?? '—')} />
        <Meta label={t('Object')} value={String(nested.object ?? 'response')} />
        <Meta
          label={t('Model')}
          value={String(nested.model ?? log.modelName)}
        />
        {choice?.finish_reason && (
          <Meta
            label={t('Finish reason')}
            value={String(choice.finish_reason)}
          />
        )}
      </div>
      <MessageList messages={messages} />
      <div className="observer-usage">
        <Meta
          label={t('Input')}
          value={`${usage?.prompt_tokens ?? usage?.input_tokens ?? log.inputToken} tok`}
        />
        <Meta
          label={t('Output')}
          value={`${usage?.completion_tokens ?? usage?.output_tokens ?? log.outputToken} tok`}
        />
        <Meta
          label={t('Total')}
          value={`${usage?.total_tokens ?? log.inputToken + log.outputToken} tok`}
        />
      </div>
    </div>
  );
}

function MessageList({
  messages,
  pending,
  error,
}: {
  messages: DisplayMessage[];
  pending?: boolean;
  error?: string;
}) {
  return (
    <div className="observer-conversation">
      {messages.map((message, index) => (
        <article
          key={`${message.role}-${index}`}
          className={`observer-turn role-${message.role}`}
        >
          <div className="observer-turn-label">
            <span>{getRoleLabel(message.role)}</span>
            {message.name && <code>{message.name}()</code>}
          </div>
          {message.content && message.role !== 'tool' && (
            <div className="observer-bubble">{message.content}</div>
          )}
          {message.toolCalls.map((call, callIndex) => (
            <div
              className="observer-tool-call"
              key={`${call.id ?? call.name}-${callIndex}`}
            >
              <div>
                <LuWrench />
                <strong>{call.name}</strong>
                <span>{t('Call')}</span>
              </div>
              <JsonValue value={call.args} depth={0} />
            </div>
          ))}
          {message.role === 'tool' && message.content && (
            <div className="observer-tool-call is-result">
              <div>
                <LuCheck />
                <strong>{message.name ?? t('Tool result')}</strong>
                <span>{t('Result')}</span>
              </div>
              <JsonValue value={parseJson(message.content)} depth={0} />
            </div>
          )}
        </article>
      ))}
      {pending && (
        <div className="observer-pending">
          <i />
          {t('Streaming response in progress…')}
        </div>
      )}
      {error && <div className="observer-error">{error}</div>}
      {!messages.length && !pending && !error && (
        <div className="observer-empty-inline">
          {t('No content to display')}
        </div>
      )}
    </div>
  );
}

function StatusPill({
  status,
  compact,
}: {
  status: string;
  compact?: boolean;
}) {
  const label = getStatusLabel(status);
  return (
    <span
      className={`observer-status status-${status.toLowerCase()}${compact ? ' is-compact' : ''}`}
    >
      <i />
      {compact ? '' : label}
      {compact && <span className="sr-only">{label}</span>}
    </span>
  );
}

function getStatusLabel(status: string): string {
  if (status === 'All') return t('All');
  if (status === 'Success') return t('Success');
  if (status === 'Failed') return t('Failed');
  if (status === 'Pending') return t('Pending');
  return status;
}

function getRoleLabel(role: string): string {
  if (role === 'system') return t('System');
  if (role === 'user') return t('User');
  if (role === 'assistant') return t('Assistant');
  if (role === 'tool') return t('Tool');
  return role;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="observer-meta">
      <b>{label}</b>
      <code>{value}</code>
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function JsonViewer({ label, value }: { label: string; value: unknown }) {
  const text = stringify(value);
  const large = text.length > 1_000_000;

  return (
    <details className="observer-json" open>
      <summary>
        <span>{label}</span>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            navigator.clipboard?.writeText(text);
          }}
        >
          <LuCopy />
          {t('Copy')}
        </button>
      </summary>
      {large ? (
        // ponytail: raw text above 1 MB; add virtualization only when real payloads require interactive trees at that size.
        <pre className="observer-large-json">{text}</pre>
      ) : (
        <div className="observer-json-tree">
          <JsonValue value={value} depth={0} />
        </div>
      )}
    </details>
  );
}

function JsonValue({ value, depth }: { value: unknown; depth: number }) {
  if (value === null) return <span className="json-null">null</span>;
  if (typeof value === 'string')
    return <span className="json-string">{JSON.stringify(value)}</span>;
  if (typeof value === 'number')
    return <span className="json-number">{String(value)}</span>;
  if (typeof value === 'boolean')
    return <span className="json-boolean">{String(value)}</span>;

  if (Array.isArray(value) || asRecord(value)) {
    const entries = Array.isArray(value)
      ? value.map((item, index) => [String(index), item] as const)
      : Object.entries(value as AnyRecord);
    const brackets = Array.isArray(value) ? ['[', ']'] : ['{', '}'];

    return (
      <details className="json-branch" open={depth < 2}>
        <summary>
          <span>{brackets[0]}</span>
          <em>{t('{{count}} items', { count: entries.length })}</em>
          <span>{brackets[1]}</span>
        </summary>
        <div>
          {entries.map(([key, item]) => (
            <div className="json-row" key={key}>
              <span className="json-key">
                {Array.isArray(value) ? key : JSON.stringify(key)}
              </span>
              <span className="json-colon">: </span>
              <JsonValue value={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      </details>
    );
  }

  return <span>{String(value)}</span>;
}

function getRequestMessages(value: unknown): DisplayMessage[] {
  const request = asRecord(value);
  if (!request) return [];
  const result: DisplayMessage[] = [];

  if (request.system !== undefined) {
    result.push(toDisplayMessage({ role: 'system', content: request.system }));
  }

  const input = request.messages ?? request.input;
  if (typeof input === 'string') {
    result.push(toDisplayMessage({ role: 'user', content: input }));
  } else if (Array.isArray(input)) {
    input.forEach((message) => {
      if (typeof message === 'string') {
        result.push(toDisplayMessage({ role: 'user', content: message }));
      } else {
        result.push(toDisplayMessage(message));
      }
    });
  }

  return result;
}

function getResponseMessages(value: unknown): DisplayMessage[] {
  const response = asRecord(value);
  if (!response) return [];
  const nested = asRecord(response.response) ?? response;
  const messages: DisplayMessage[] = [];

  if (Array.isArray(nested.choices)) {
    nested.choices.forEach((choice: unknown) => {
      const record = asRecord(choice);
      if (record?.message) messages.push(toDisplayMessage(record.message));
    });
    return messages;
  }

  if (Array.isArray(nested.output)) {
    nested.output.forEach((item: unknown) =>
      messages.push(toDisplayMessage(item))
    );
    return messages;
  }

  if (Array.isArray(nested.content)) {
    messages.push(
      toDisplayMessage({
        role: nested.role ?? 'assistant',
        content: nested.content,
      })
    );
    return messages;
  }

  if (response.content || response.tool_calls || response.tool_use) {
    messages.push(
      toDisplayMessage({
        role: 'assistant',
        content: response.content,
        tool_calls: response.tool_calls,
        tool_use: response.tool_use,
      })
    );
  }

  return messages;
}

function toDisplayMessage(value: unknown): DisplayMessage {
  const message = asRecord(value) ?? {};
  const type = String(message.type ?? '');
  const contentParts = Array.isArray(message.content) ? message.content : [];
  const toolResults = contentParts
    .map(asRecord)
    .filter((part): part is AnyRecord =>
      Boolean(
        part &&
          (part.type === 'tool_result' ||
            String(part.type).endsWith('_tool_result'))
      )
    );
  const role =
    type === 'function_call_output' ||
    type === 'tool_result' ||
    type.endsWith('_tool_result') ||
    toolResults.length
      ? 'tool'
      : String(message.role ?? 'assistant');
  const content =
    type === 'function_call_output'
      ? message.output
      : toolResults.length
        ? toolResults.flatMap((result) =>
            Array.isArray(result.content) ? result.content : [result.content]
          )
        : (message.content ?? message.text);
  const directCalls = Array.isArray(message.tool_calls)
    ? message.tool_calls
    : [];
  const anthropicCalls = Array.isArray(message.tool_use)
    ? message.tool_use
    : [];
  const contentCalls = contentParts.filter((part) => {
    const partType = asRecord(part)?.type;
    return partType === 'tool_use' || partType === 'server_tool_use';
  });
  const responseCall = [
    'function_call',
    'tool_use',
    'server_tool_use',
  ].includes(type)
    ? [message]
    : [];

  return {
    role,
    name: message.name ?? toolResults[0]?.name,
    content: contentToText(content),
    toolCalls: [
      ...directCalls,
      ...anthropicCalls,
      ...contentCalls,
      ...responseCall,
    ].map(toToolCall),
  };
}

function toToolCall(value: unknown): DisplayToolCall {
  const call = asRecord(value) ?? {};
  const fn = asRecord(call.function) ?? call;
  const args = fn.arguments ?? fn.args ?? fn.input ?? {};

  return {
    id: call.id ?? call.call_id,
    name: String(fn.name ?? t('Tool')),
    args: parseJson(args),
  };
}

function contentToText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  if (!Array.isArray(value)) return stringify(value);

  return value
    .map((part) => {
      if (typeof part === 'string') return part;
      const item = asRecord(part);
      if (!item || item.type === 'tool_use' || item.type === 'server_tool_use')
        return '';
      if (item.type === 'image_url')
        return `[${t('Image')}] ${item.image_url?.url ?? ''}`;
      if (item.type === 'json') return stringify(item.json);
      const content =
        item.text ??
        item.output_text ??
        item.input_text ??
        item.content ??
        item.json ??
        '';
      return typeof content === 'string' ? content : stringify(content);
    })
    .filter(Boolean)
    .join('\n');
}

function getPromptPreview(log: AIGatewayLogItem): string {
  const messages = getRequestMessages(log.requestPayload);
  const prompt = [...messages]
    .reverse()
    .find((message) => message.role === 'user' && message.content)?.content;
  return prompt?.replace(/\s+/g, ' ').slice(0, 100) || log.id;
}

function getResponseError(value: unknown): string | undefined {
  const error = asRecord(value)?.error;
  if (typeof error === 'string') return error;
  const record = asRecord(error);
  return record
    ? String(record.message ?? record.type ?? stringify(record))
    : undefined;
}

function asRecord(value: unknown): AnyRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as AnyRecord)
    : null;
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDuration(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${value}ms`;
}

function percentile95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

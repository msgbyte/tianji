import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ConnectionStringEditorProps {
  driver: string;
  value: string;
  onChange: (next: string) => void;
}

/**
 * Get the default port for a given database driver
 */
function getDefaultPort(driver: string): string {
  switch (driver) {
    case 'postgresql':
      return '5432';
    case 'mysql':
    default:
      return '3306';
  }
}

/**
 * Get the placeholder example for a given database driver
 */
function getPlaceholderExample(driver: string): string {
  switch (driver) {
    case 'postgresql':
      return 'e.g. postgresql://user:pass@host:5432/db?schema=public';
    case 'mysql':
    default:
      return 'e.g. mysql://user:pass@host:3306/db';
  }
}

/**
 * A small helper to safely parse a JDBC-like connection string using the URL API.
 */
function parseConnectionUri(uri: string): {
  protocol: string;
  username: string;
  password: string;
  host: string;
  port: string;
  database: string;
  queryParams: string;
} | null {
  try {
    const url = new URL(uri);
    const database = url.pathname?.replace(/^\//, '') ?? '';

    const queryParams = url.searchParams.toString();

    return {
      protocol: url.protocol.replace(/:$/, ''),
      username: decodeURIComponent(url.username ?? ''),
      password: decodeURIComponent(url.password ?? ''),
      host: url.hostname ?? '',
      port: url.port ?? '',
      database,
      queryParams,
    };
  } catch {
    return null;
  }
}

function buildConnectionUri(params: {
  driver: string;
  username: string;
  password: string;
  host: string;
  port: string;
  database: string;
  queryParams?: string;
}): string {
  const protocol = params.driver || 'mysql';
  const auth = params.username
    ? `${encodeURIComponent(params.username)}${params.password ? `:${encodeURIComponent(params.password)}` : ''}@`
    : '';
  const host = params.host || 'localhost';
  const port = params.port ? `:${params.port}` : '';
  const db = params.database ? `/${params.database}` : '';

  const queryString = params.queryParams?.toString() || '';
  const query = queryString ? `?${queryString}` : '';

  return `${protocol}://${auth}${host}${port}${db}${query}`;
}

export const ConnectionStringEditor: React.FC<ConnectionStringEditorProps> = (
  props
) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'uri' | 'compose'>('uri');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [database, setDatabase] = useState('');
  const [queryParams, setQueryParams] = useState('');

  // Track if we're currently syncing to prevent loops
  const isSyncingRef = useRef(false);
  // Track the last synced value to detect external changes
  const lastSyncedValueRef = useRef(props.value);

  const composedUri = useMemo(
    () =>
      buildConnectionUri({
        driver: props.driver,
        username,
        password,
        host,
        port,
        database,
        queryParams,
      }),
    [props.driver, username, password, host, port, database, queryParams]
  );

  // Sync compose fields from URI
  const syncFieldsFromUri = useCallback(
    (uri: string) => {
      const parsed = parseConnectionUri(uri);
      if (parsed) {
        setUsername(parsed.username || '');
        setPassword(parsed.password || '');
        setHost(parsed.host || '');
        setPort(parsed.port || getDefaultPort(props.driver));
        setDatabase(parsed.database || '');
        setQueryParams(parsed.queryParams || '');
      } else {
        setUsername('');
        setPassword('');
        setHost('');
        setPort(getDefaultPort(props.driver));
        setDatabase('');
        setQueryParams('');
      }
    },
    [props.driver]
  );

  // Handle external value changes (e.g., from parent or initial load)
  useEffect(() => {
    // Skip if we're the ones who triggered this change
    if (isSyncingRef.current) {
      return;
    }
    // Only sync if value actually changed externally
    if (props.value !== lastSyncedValueRef.current) {
      lastSyncedValueRef.current = props.value;
      syncFieldsFromUri(props.value);
    }
  }, [props.value, syncFieldsFromUri]);

  // Handle tab change - sync fields when switching to compose
  const handleTabChange = useCallback(
    (newTab: string) => {
      const nextTab = newTab as 'uri' | 'compose';
      if (nextTab === 'compose' && tab === 'uri') {
        // Switching to compose mode - sync fields from current URI value
        syncFieldsFromUri(props.value);
      }
      setTab(nextTab);
    },
    [tab, props.value, syncFieldsFromUri]
  );

  // When compose fields change while in compose mode, update value
  useEffect(() => {
    if (tab !== 'compose') return;

    const next = composedUri;
    if (next !== props.value) {
      isSyncingRef.current = true;
      lastSyncedValueRef.current = next;
      props.onChange(next);
      // Reset sync flag after React processes the update
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, [tab, composedUri, props.value, props.onChange]);

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="uri">{t('Connection URI')}</TabsTrigger>
        <TabsTrigger value="compose">{t('Compose')}</TabsTrigger>
      </TabsList>

      <TabsContent value="uri" className="space-y-2">
        <Label>{t('Connection URI')}</Label>
        <Input
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={t(getPlaceholderExample(props.driver))}
        />
      </TabsContent>

      <TabsContent value="compose" className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('Host')}</Label>
            <Input value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('Port')}</Label>
            <Input value={port} onChange={(e) => setPort(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('Username')}</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('Password')}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('Database')}</Label>
            <Input
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('Query Parameters')}</Label>
          <Input
            value={queryParams}
            onChange={(e) => setQueryParams(e.target.value)}
            placeholder="sslmode=require&connect_timeout=10"
          />
        </div>

        <div className="space-y-2">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Connection URI: {composedUri || '-'}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

ConnectionStringEditor.displayName = 'ConnectionStringEditor';

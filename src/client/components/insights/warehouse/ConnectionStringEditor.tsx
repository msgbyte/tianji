import React, { useEffect, useMemo, useState } from 'react';
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
 * A small helper to safely parse a JDBC-like connection string using the URL API.
 */
function parseConnectionUri(uri: string): {
  protocol: string;
  username: string;
  password: string;
  host: string;
  port: string;
  database: string;
} | null {
  try {
    const url = new URL(uri);
    const database = url.pathname?.replace(/^\//, '') ?? '';
    return {
      protocol: url.protocol.replace(/:$/, ''),
      username: decodeURIComponent(url.username ?? ''),
      password: decodeURIComponent(url.password ?? ''),
      host: url.hostname ?? '',
      port: url.port ?? '',
      database,
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
}): string {
  const protocol = params.driver || 'mysql';
  const auth = params.username
    ? `${encodeURIComponent(params.username)}${params.password ? `:${encodeURIComponent(params.password)}` : ''}@`
    : '';
  const host = params.host || 'localhost';
  const port = params.port ? `:${params.port}` : '';
  const db = params.database ? `/${params.database}` : '';
  return `${protocol}://${auth}${host}${port}${db}`;
}

export const ConnectionStringEditor: React.FC<ConnectionStringEditorProps> = (
  props
) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'uri' | 'compose'>('uri');

  const parsed = useMemo(() => parseConnectionUri(props.value), [props.value]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [database, setDatabase] = useState('');
  const composedUri = useMemo(
    () =>
      buildConnectionUri({
        driver: props.driver,
        username,
        password,
        host,
        port,
        database,
      }),
    [props.driver, username, password, host, port, database]
  );

  // initialize compose fields from value
  useEffect(() => {
    if (parsed) {
      setUsername(parsed.username || '');
      setPassword(parsed.password || '');
      setHost(parsed.host || '');
      setPort(parsed.port || (props.driver === 'mysql' ? '3306' : ''));
      setDatabase(parsed.database || '');
    } else {
      setUsername('');
      setPassword('');
      setHost('');
      setPort(props.driver === 'mysql' ? '3306' : '');
      setDatabase('');
    }
    // only react to value changes, not driver
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  // when compose fields change, update value
  useEffect(() => {
    if (tab !== 'compose') return;
    const next = buildConnectionUri({
      driver: props.driver,
      username,
      password,
      host,
      port,
      database,
    });
    props.onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, username, password, host, port, database, props.driver]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'uri' | 'compose')}>
      <TabsList>
        <TabsTrigger value="uri">{t('Connection URI')}</TabsTrigger>
        <TabsTrigger value="compose">{t('Compose')}</TabsTrigger>
      </TabsList>

      <TabsContent value="uri" className="space-y-2">
        <Label>{t('Connection URI')}</Label>
        <Input
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={t('e.g. mysql://user:pass@host:3306/db')}
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
          <div className="space-y-2 md:col-span-2">
            <Label>{t('Database')}</Label>
            <Input
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
            />
          </div>
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

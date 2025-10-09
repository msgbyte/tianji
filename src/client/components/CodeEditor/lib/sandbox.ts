export const sandboxGlobal = `
interface AxiosConfig {
  url?: string;
  method?:
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'head' | 'HEAD'
    | 'options' | 'OPTIONS'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH'
    | 'purge' | 'PURGE'
    | 'link' | 'LINK'
    | 'unlink' | 'UNLINK';
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: any;
  timeout?: number;
  withCredentials?: boolean;
  auth?: {
    username: string;
    password: string;
  };
  responseType?:
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'json'
    | 'text'
    | 'stream';
  responseEncoding?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  maxContentLength?: number;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
    protocol?: string;
  } | false;
}

interface RequestReturn {
  headers: Record<string, string>;
  data: any;
  status: number;
}

interface FetchContext {
  type: 'http' | 'cron' | 'manual' | 'test';
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
}

interface Console {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
}

declare const console: Console;

declare function request(config: AxiosConfig): Promise<RequestReturn>;

const request = async (config: AxiosConfig): Promise<RequestReturn> => {};

declare function fetch(params: Record<string, any>, ctx: FetchContext): Promise<string>;
`;

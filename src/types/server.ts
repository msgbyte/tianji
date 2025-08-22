import { type IncomingHttpHeaders } from 'http';

export interface ServerStatusInfo {
  workspaceId: string;
  name: string;
  hostname: string;
  timeout: number;
  updatedAt: number;
  payload: ServerStatusInfoPayload & ServerStatusRequestContext;
  secret?: string; // optional secret
}

export interface ServerStatusInfoPayload {
  uptime: number;
  load: number;
  memory_total: number;
  memory_used: number;
  swap_total: number;
  swap_used: number;
  hdd_total: number;
  hdd_used: number;
  cpu: number;
  network_tx: number;
  network_rx: number;
  network_in: number;
  network_out: number;

  top_cpu_processes?: ProcessInfo[];
  top_memory_processes?: ProcessInfo[];

  // docker info
  docker?: ServerStatusDockerContainerPayload[];
}

export interface ServerStatusRequestContext {
  country?: string;
  ip?: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

export interface ServerStatusDockerContainerPayload {
  id: string;
  image: string;
  imageId: string;
  ports: ServerStatusDockerContainerPort[];
  createdAt: number;
  state: string;
  status: string;
  cpuPercent: number;
  memory: number;
  memLimit: number;
  memPercent: number;
  storageWriteSize: number;
  storageReadSize: number;
  networkRx: number;
  networkTx: number;
  ioRead: number;
  ioWrite: number;
}

export interface ServerStatusDockerContainerPort {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: 'tcp' | 'udp';
}

export interface PlaygroundWebhookRequestPayload {
  id: string;
  url: string;
  method: string;
  headers: IncomingHttpHeaders;
  body: string;
  createdAt: number;
}

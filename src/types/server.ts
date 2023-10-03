export interface ServerStatusInfo {
  workspaceId: string;
  name: string;
  hostname: string;
  timeout: number;
  updatedAt: number;
  payload: ServerStatusInfoPayload;
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
}

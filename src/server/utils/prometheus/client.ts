import Prometheus from 'prom-client';

export const promTrpcRequest = new Prometheus.Histogram({
  name: 'trpc_request_duration_seconds',
  help: 'Duration of TRPC requests in seconds',
  labelNames: ['route', 'type', 'status'],
});

export const promUserCounter = new Prometheus.Gauge({
  name: 'tianji_user_counter',
  help: 'user counter',
});

export const promWorkspaceCounter = new Prometheus.Gauge({
  name: 'tianji_workspace_counter',
  help: 'workspace counter',
});

export const promMonitorRunnerCounter = new Prometheus.Gauge({
  name: 'tianji_monitor_runner_counter',
  help: 'monitor runner counter',
});

export const promServerCounter = new Prometheus.Gauge({
  name: 'tianji_server_count',
  help: 'server count',
  labelNames: ['workspaceId'],
});

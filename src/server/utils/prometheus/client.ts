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

export const promCronCounter = new Prometheus.Counter({
  name: 'tianji_cron_counter',
  help: 'cron counter',
  labelNames: ['period'],
});

export const promMQProduceCounter = new Prometheus.Counter({
  name: 'tianji_mq_produce_counter',
  help: 'mq produce counter',
  labelNames: ['type'],
});

export const promMQConsumeCounter = new Prometheus.Counter({
  name: 'tianji_mq_consume_counter',
  help: 'mq consume counter',
  labelNames: ['type'],
});

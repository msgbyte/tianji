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

export const promWorkerExecutionCounter = new Prometheus.Counter({
  name: 'tianji_worker_execution_total',
  help: 'Total number of function worker executions',
  labelNames: ['workerId', 'status'],
});

export const promWorkerExecutionDuration = new Prometheus.Histogram({
  name: 'tianji_worker_execution_duration_seconds',
  help: 'Duration of function worker executions in seconds',
  labelNames: ['workerId', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const promWorkerCPUTime = new Prometheus.Histogram({
  name: 'tianji_worker_cpu_time_nanoseconds',
  help: 'CPU time used by function worker in nanoseconds',
  labelNames: ['workerId', 'status'],
  buckets: [
    1000, 5000, 10000, 50000, 100000, 1000000, 5000000, 10000000, 50000000,
    100000000,
  ],
});

export const promWorkerMemoryUsage = new Prometheus.Histogram({
  name: 'tianji_worker_memory_bytes',
  help: 'Memory used by function worker in bytes',
  labelNames: ['workerId', 'status'],
  buckets: [1024, 10240, 102400, 1048576, 5242880, 10485760],
});

export const promWebsiteEventCounter = new Prometheus.Counter({
  name: 'tianji_website_event_counter',
  help: 'website event counter',
  labelNames: ['websiteId', 'eventType', 'endpoint'],
});

export const promApplicationEventCounter = new Prometheus.Counter({
  name: 'tianji_application_event_counter',
  help: 'application event counter',
  labelNames: ['applicationId', 'eventType', 'endpoint'],
});

export const promAIGatewayRequestCounter = new Prometheus.Counter({
  name: 'tianji_ai_gateway_request_total',
  help: 'Total number of AI Gateway requests',
  labelNames: ['modelProvider'],
});

export const promSurveySubmitCounter = new Prometheus.Counter({
  name: 'tianji_survey_submit_total',
  help: 'Total number of survey submissions',
  labelNames: ['surveyId'],
});

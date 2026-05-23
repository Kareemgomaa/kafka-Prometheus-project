import client from 'prom-client';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code']
});

export const kafkaProducedCounter = new client.Counter({
  name: 'kafka_messages_produced_total',
  help: 'Total number of messages sent to Kafka',
  labelNames: ['topic']
});

export const getMetrics = async () => {
  return await client.register.metrics();
};

export const metricsContentType = client.register.contentType;
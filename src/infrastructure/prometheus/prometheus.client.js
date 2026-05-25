import client from 'prom-client';

client.collectDefaultMetrics({ register: client.register });

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

export const metricsTracker = {
  incKafkaProduced: (topic) => kafkaProducedCounter.inc({ topic }),
  incHttpRequests: (method, route, status_code) => httpRequestCounter.inc({ method, route, status_code }),
  getMetricsContentType: () => client.register.contentType,
  getExposedMetrics: async () => await client.register.metrics()
};
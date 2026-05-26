import client from 'prom-client';
import { IMetricsTracker } from '../../application/interfaces/metrics-tracker.interface.js';

client.collectDefaultMetrics({ register: client.register });

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code']
});

const kafkaProducedCounter = new client.Counter({
  name: 'kafka_messages_produced_total',
  help: 'Total number of messages sent to Kafka',
  labelNames: ['topic']
});

export class PrometheusMetricsTracker implements IMetricsTracker {
  incKafkaProduced(topic: string): void {
    kafkaProducedCounter.inc({ topic });
  }

  incHttpRequests(method: string, route: string, statusCode: string | number): void {
    httpRequestCounter.inc({ method, route, status_code: statusCode.toString() });
  }

  getMetricsContentType(): string {
    return client.register.contentType;
  }

  async getExposedMetrics(): Promise<string> {
    return await client.register.metrics();
  }
}
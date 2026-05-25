export interface IMetricsTracker {
  incKafkaProduced(topic: string): void;
  incHttpRequests(method: string, route: string, statusCode: string | number): void;
}
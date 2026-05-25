export interface IMetricsGateway {
  getMetricRange(query: string): Promise<any[]>;
}
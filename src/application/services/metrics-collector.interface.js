export class IMetricsGateway {
  async getMetricRange(query) {
    throw new Error("Method 'getMetricRange()' must be implemented.");
  }
}
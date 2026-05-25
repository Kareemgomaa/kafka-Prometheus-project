import { metricsTracker } from '../../prometheus/prometheus.client.js';

export class MetricsController {
  constructor(getMetricsUseCase) {
    this.getMetricsUseCase = getMetricsUseCase;
  }

  handlePrometheusScraping = async (req, res) => {
    res.setHeader('Content-Type', metricsTracker.getMetricsContentType());
    res.send(await metricsTracker.getExposedMetrics());
  };

  handleGetSingleMetric = (type) => {
    return async (req, res) => {
      try {
        const chartData = await this.getMetricsUseCase.executeSingleMetric(type);
        res.json({ success: true, type, data: chartData });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    };
  };
}
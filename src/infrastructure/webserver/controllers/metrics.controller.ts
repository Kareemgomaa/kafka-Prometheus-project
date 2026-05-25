import { Request, Response } from 'express';
import { GetMetricsUseCase } from '../../../application/use-cases/get-metrics.usecase.js';
import { PrometheusMetricsTracker } from '../../prometheus/prometheus.client.js';

export class MetricsController {
  constructor(
    private getMetricsUseCase: GetMetricsUseCase,
    private metricsTracker: PrometheusMetricsTracker
  ) {}

  handlePrometheusScraping = async (req: Request, res: Response): Promise<void> => {
    res.setHeader('Content-Type', this.metricsTracker.getMetricsContentType());
    res.send(await this.metricsTracker.getExposedMetrics());
  };

  handleGetSingleMetric = (type: 'requests' | 'ram' | 'cpu' | 'disk') => {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        const chartData = await this.getMetricsUseCase.executeSingleMetric(type);
        res.json({ success: true, type, data: chartData });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    };
  };
}
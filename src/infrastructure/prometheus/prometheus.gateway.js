import axios from 'axios';
import { ENV } from '../config/environment.js';
import { IMetricsGateway } from '../../application/services/metrics-collector.interface.js';

export class PrometheusGateway extends IMetricsGateway {
  async getMetricRange(query) {
    try {
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 5 * 60 * 1000).toISOString(); 
      const response = await axios.get(ENV.PROMETHEUS_URL, { 
        params: { query, start, end, step: '15s' } 
      });
      return response.data.data.result;
    } catch (error) {
      console.error(`Error pulling from Prometheus [${query}]:`, error.message);
      return [];
    }
  }
}
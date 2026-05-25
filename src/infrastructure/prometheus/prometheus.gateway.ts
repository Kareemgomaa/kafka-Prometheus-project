import axios from 'axios';
import { ENV } from '../config/environment.js';
import { IMetricsGateway } from '../../application/interfaces/metrics-gateway.interface.js';

export class PrometheusGateway implements IMetricsGateway {
  async getMetricRange(query: string): Promise<any[]> {
    try {
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 5 * 60 * 1000).toISOString(); 
      const response = await axios.get(ENV.PROMETHEUS_URL, { 
        params: { query, start, end, step: '15s' } 
      });
      return response.data.data.result;
    } catch (error: any) {
      console.error(`Error pulling from Prometheus [${query}]:`, error.message);
      return [];
    }
  }
}
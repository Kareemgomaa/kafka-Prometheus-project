import express from 'express';
import cors from 'cors';
import { traceMiddleware } from './middlewares/trace.middleware.js';

export function createExpressApp({ orderController, metricsController }) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(traceMiddleware);

  app.get('/api/order', orderController.handlePlaceOrder);
  app.get('/metrics', metricsController.handlePrometheusScraping);
  
  app.get('/api/admin/metrics/requests', metricsController.handleGetSingleMetric('requests'));
  app.get('/api/admin/metrics/ram', metricsController.handleGetSingleMetric('ram'));
  app.get('/api/admin/metrics/cpu', metricsController.handleGetSingleMetric('cpu'));
  app.get('/api/admin/metrics/disk', metricsController.handleGetSingleMetric('disk'));

  return app;
}
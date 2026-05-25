import express, { Express } from 'express';
import cors from 'cors';
import { createTraceMiddleware } from './middlewares/trace.middleware.js';
import { OrderController } from './controllers/order.controller.js';
import { MetricsController } from './controllers/metrics.controller.js';
import { PrometheusMetricsTracker } from '../prometheus/prometheus.client.js';

interface ExpressAppDependencies {
  orderController: OrderController;
  metricsController: MetricsController;
  metricsTracker: PrometheusMetricsTracker;
}

export function createExpressApp({ orderController, metricsController, metricsTracker }: ExpressAppDependencies): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(createTraceMiddleware(metricsTracker));

  // HTTP Routes
  app.get('/api/order', orderController.handlePlaceOrder);
  app.get('/metrics', metricsController.handlePrometheusScraping);
  
  // Dashboard Metrics
  app.get('/api/admin/metrics/requests', metricsController.handleGetSingleMetric('requests'));
  app.get('/api/admin/metrics/ram', metricsController.handleGetSingleMetric('ram'));
  app.get('/api/admin/metrics/cpu', metricsController.handleGetSingleMetric('cpu'));
  app.get('/api/admin/metrics/disk', metricsController.handleGetSingleMetric('disk'));

  return app;
}
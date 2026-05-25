import { createServer } from 'http';
import { ENV } from './infrastructure/config/environment.js';
import { KafkaProducerAdapter } from './infrastructure/kafka/kafka.producer.js';
import { PrometheusMetricsTracker } from './infrastructure/prometheus/prometheus.client.js';
import { PrometheusGateway } from './infrastructure/prometheus/prometheus.gateway.js';

import { PlaceOrderUseCase } from './application/use-cases/place-order.usecase.js';
import { GetMetricsUseCase } from './application/use-cases/get-metrics.usecase.js';

import { OrderController } from './infrastructure/webserver/controllers/order.controller.js';
import { MetricsController } from './infrastructure/webserver/controllers/metrics.controller.js';
import { createExpressApp } from './infrastructure/webserver/express.server.js';
import { initWebSocketServer } from './infrastructure/websocket/socket.server.js';

async function bootstrap() {
  const kafkaProducerImpl = new KafkaProducerAdapter();
  const metricsTrackerImpl = new PrometheusMetricsTracker();
  const prometheusGatewayImpl = new PrometheusGateway();

  const placeOrderUseCase = new PlaceOrderUseCase(kafkaProducerImpl, metricsTrackerImpl);
  const getMetricsUseCase = new GetMetricsUseCase(prometheusGatewayImpl);

  const orderController = new OrderController(placeOrderUseCase);
  const metricsController = new MetricsController(getMetricsUseCase, metricsTrackerImpl);

  const app = createExpressApp({ orderController, metricsController, metricsTracker: metricsTrackerImpl });
  const httpServer = createServer(app);
  
  initWebSocketServer(httpServer, getMetricsUseCase);

  httpServer.listen(ENV.PORT, async () => {
    console.log(` Server running on port ${ENV.PORT} (TypeScript & Clean Architecture Enabled)`);
    await kafkaProducerImpl.connect();
  });
}

bootstrap();
import { createServer } from 'http';
import { ENV } from './infrastructure/config/environment.js';
import { KafkaProducerAdapter } from './infrastructure/kafka/kafka.producer.js';
import { metricsTracker } from './infrastructure/prometheus/prometheus.client.js';
import { PrometheusGateway } from './infrastructure/prometheus/prometheus.gateway.js';

import { PlaceOrderUseCase } from './application/use-cases/place-order.usecase.js';
import { GetMetricsUseCase } from './application/use-cases/get-metrics.usecase.js';

import { OrderController } from './infrastructure/webserver/controllers/order.controller.js';
import { MetricsController } from './infrastructure/webserver/controllers/metrics.controller.js';
import { createExpressApp } from './infrastructure/webserver/express.server.js';
import { initWebSocketServer } from './infrastructure/websocket/socket.server.js';

async function bootstrap() {
  const prometheusGateway = new PrometheusGateway();

  const placeOrderUseCase = new PlaceOrderUseCase(KafkaProducerAdapter, metricsTracker);
  const getMetricsUseCase = new GetMetricsUseCase(prometheusGateway);

  const orderController = new OrderController(placeOrderUseCase);
  const metricsController = new MetricsController(getMetricsUseCase);

  const app = createExpressApp({ orderController, metricsController });
  const httpServer = createServer(app);
  
  initWebSocketServer(httpServer, getMetricsUseCase);

  httpServer.listen(3000, async () => {
    console.log(` Server running on port 3000 (HTTP & WebSockets Enabled via Clean Architecture)`);
    await KafkaProducerAdapter.connect();
  });
}

bootstrap();

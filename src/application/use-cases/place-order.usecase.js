import { Order } from '../../domain/entities/order.entity.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class PlaceOrderUseCase {
  constructor(kafkaProducer, metricsTracker) {
    this.kafkaProducer = kafkaProducer;
    this.metricsTracker = metricsTracker;
  }

  async execute(traceId) {
    console.log(`\n------------------------------------------------------`);
    console.log(`[UseCase] Trace ID: ${traceId}`);
    console.log(`[UseCase] waiting for 3 seconds before sending event to Kafka...`);
    console.log(`------------------------------------------------------`);

    await delay(3000);

    const order = new Order({});
    const topicName = 'order-events';

    await this.kafkaProducer.send(topicName, order.toJSON(), traceId);

    this.metricsTracker.incKafkaProduced(topicName);

    console.log(`[UseCase] send event to Kafka with Trace ID: ${traceId}`);
    
    return {
      success: true,
      message: "Order placed and sent to Kafka via slowed motion!",
      traceId
    };
  }
}
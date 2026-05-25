import { Order } from '../../domain/entities/order.entity.js';
import { IKafkaProducer } from '../interfaces/kafka-producer.interface.js';
import { IMetricsTracker } from '../interfaces/metrics-tracker.interface.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class PlaceOrderUseCase {
  constructor(
    private kafkaProducer: IKafkaProducer,
    private metricsTracker: IMetricsTracker
  ) {}

  async execute(traceId: string) {
    console.log(`\n------------------------------------------------------`);
    console.log(`[UseCase] Trace ID: ${traceId}`);
    console.log(`[UseCase] waiting for 3 seconds before sending event to Kafka...`);
    console.log(`------------------------------------------------------`);

    await delay(3000);

    const order = new Order({});
    const topicName = 'order-events';

    // الـ Use Case بتنادي الـ Interface وهي مغمضة ومبتعرفش الـ Implementation معمول بإيه
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
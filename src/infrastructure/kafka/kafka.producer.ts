import { Kafka, Producer } from 'kafkajs';
import { ENV } from '../config/environment.js';
import { IKafkaProducer } from '../../application/interfaces/kafka-producer.interface.js';

export class KafkaProducerAdapter implements IKafkaProducer {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'order-service', 
      brokers: ENV.KAFKA_BROKERS
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log('Kafka Producer Connected Successfully!');
    } catch (error) {
      console.error('Failed to connect to Kafka:', error);
    }
  }

  async send(topic: string, payload: any, traceId: string): Promise<void> {
    await this.producer.send({
      topic: topic,
      messages: [
        {
          value: JSON.stringify(payload),
          headers: {
            'x-trace-id': traceId 
          }
        }
      ]
    });
  }
}
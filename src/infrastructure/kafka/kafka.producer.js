import { Kafka } from 'kafkajs';
import { ENV } from '../config/environment.js';

const kafka = new Kafka({
  clientId: 'order-service', 
  brokers: ENV.KAFKA_BROKERS
});

const producer = kafka.producer();

export const KafkaProducerAdapter = {
  connect: async () => {
    try {
      await producer.connect();
      console.log(' Kafka Producer Connected Successfully!');
    } catch (error) {
      console.error(' Failed to connect to Kafka:', error);
    }
  },
  send: async (topic, payload, traceId) => {
    await producer.send({
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
};
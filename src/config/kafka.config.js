import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'order-service', 
  brokers: ['localhost:9092'] 
});

export const producer = kafka.producer();

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer Connected Successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to Kafka:', error);
  }
};
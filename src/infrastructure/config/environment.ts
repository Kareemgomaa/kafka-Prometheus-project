import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  PROMETHEUS_URL: process.env.PROMETHEUS_URL || 'http://localhost:9090/api/v1/query_range',
  KAFKA_BROKERS: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
};
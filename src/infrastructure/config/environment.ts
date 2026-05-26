import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT:  3000,
  PROMETHEUS_URL: 'http://localhost:9090/api/v1/query_range',
  KAFKA_BROKERS:  ['localhost:9092']
};
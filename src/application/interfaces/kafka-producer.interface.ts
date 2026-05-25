export interface IKafkaProducer {
  connect(): Promise<void>;
  send(topic: string, payload: any, traceId: string): Promise<void>;
}
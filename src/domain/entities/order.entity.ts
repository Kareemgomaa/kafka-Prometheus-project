export interface OrderProperties {
  id?: number;
  product?: string;
  price?: number;
}

export class Order {
  public readonly orderId: number;
  public readonly product: string;
  public readonly price: number;

  constructor(props: OrderProperties) {
    this.orderId = props.id || Math.floor(Math.random() * 10000);
    this.product = props.product || 'Kafka Course';
    this.price = props.price || 150;
  }

  public toJSON() {
    return {
      orderId: this.orderId,
      product: this.product,
      price: this.price
    };
  }
}
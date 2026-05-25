export class Order {
  constructor({ id, product, price }) {
    this.orderId = id || Math.floor(Math.random() * 10000);
    this.product = product || 'Kafka Course';
    this.price = price || 150;
  }

  toJSON() {
    return {
      orderId: this.orderId,
      product: this.product,
      price: this.price
    };
  }
}
export class OrderController {
  constructor(placeOrderUseCase) {
    this.placeOrderUseCase = placeOrderUseCase;
  }

  handlePlaceOrder = async (req, res) => {
    try {
      const result = await this.placeOrderUseCase.execute(req.traceId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error inside Order Controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  };
}
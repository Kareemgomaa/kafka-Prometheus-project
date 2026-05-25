import { Request, Response } from 'express';
import { PlaceOrderUseCase } from '../../../application/use-cases/place-order.usecase.js';

export class OrderController {
  constructor(private placeOrderUseCase: PlaceOrderUseCase) {}

  handlePlaceOrder = async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await this.placeOrderUseCase.execute(req.traceId);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error inside Order Controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  };
}
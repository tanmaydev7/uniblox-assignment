import { Request, RequestHandler, Response } from 'express';
import { getUserDiscountCodes } from '../../utils/discountUtils';

interface DiscountQuery {
  mobileNo?: string;
}

interface DiscountItem {
  id: number;
  code: string;
  orderNumber: number;
  discountPercent: number;
  isUsed: boolean;
  usedByOrderId: number | null;
  createdAt: string;
}

interface DiscountResponse {
  data: {
    available: DiscountItem[];
    used: DiscountItem[];
    expired: DiscountItem[];
    nextOrderNumber: number;
  };
}

export const getDiscounts: RequestHandler = async (
  req: Request<{}, DiscountResponse, {}, DiscountQuery>,
  res: Response<DiscountResponse>,
  next
) => {
  try {
    const { mobileNo } = req.query;
    const data = await getUserDiscountCodes(mobileNo);

    return res.json({ data });
  } catch (error) {
    next(error);
  }
};

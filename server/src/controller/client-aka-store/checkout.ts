import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { validateInputs, findUser, processCheckout } from '../../utils/checkoutUtils';

interface CheckoutQuery {
  mobileNo?: string;
}

interface CheckoutBody {
  shippingAddress: string;
  discountCode?: string;
}

interface CheckoutResponse {
  data: {
    orderId: number;
    message: string;
    discountCodeCreated?: string;
  };
}

export const checkout: RequestHandler = async (
  req: Request<{}, CheckoutResponse, CheckoutBody, CheckoutQuery>,
  res: Response<CheckoutResponse>,
  next
) => {
  try {
    const { mobileNo } = req.query;
    const { shippingAddress, discountCode } = req.body;

    const { trimmedMobileNo, trimmedShippingAddress } = validateInputs(mobileNo, shippingAddress);
    const user = await findUser(trimmedMobileNo);

    const result = await db.transaction(async (tx) => {
      return await processCheckout(tx, user.id, trimmedShippingAddress, discountCode);
    });

    return res.json({
      data: {
        orderId: result.orderId,
        message: 'Order created successfully',
        ...(result.newDiscountCode && { discountCodeCreated: result.newDiscountCode }),
      },
    });
  } catch (error) {
    next(error);
  }
};

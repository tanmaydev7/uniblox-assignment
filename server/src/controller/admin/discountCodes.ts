import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { discountCodes } from '../../db/schema/discountCodes';
import { getNextGlobalOrderNumber } from '../../utils/checkoutUtils';
import { createGlobalDiscountCode } from '../../utils/discountCodeUtils';
import { generateFailureResponse } from '../../utils/errorUtils';

interface CreateGlobalDiscountCodeRequest {
  orderNumber: number;
  discountPercent?: number;
}

interface CreateGlobalDiscountCodeResponse {
  message: string;
  data: {
    code: string;
    orderNumber: number;
    nextGlobalOrderNumber: number;
  };
}

export const createGlobalDiscountCodeHandler: RequestHandler = async (
  req: Request<{}, CreateGlobalDiscountCodeResponse, CreateGlobalDiscountCodeRequest>,
  res: Response<CreateGlobalDiscountCodeResponse>,
  next
) => {
  try {
    const { orderNumber, discountPercent } = req.body;

    if (!orderNumber || typeof orderNumber !== 'number' || orderNumber < 1) {
      generateFailureResponse('Order number is required and must be a positive number', 400);
    }

    if (discountPercent !== undefined && (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100)) {
      generateFailureResponse('Discount percent must be a number between 0 and 100', 400);
    }

    // Use a transaction to ensure consistency
    const result = await db.transaction(async (tx) => {
      // Get the next global order number
      const nextGlobalOrderNumber = await getNextGlobalOrderNumber(tx);

      // Validate that the provided order number matches the next global order number
      if (orderNumber !== nextGlobalOrderNumber) {
        generateFailureResponse(
          `Next order number is not ${orderNumber}. Next order number is ${nextGlobalOrderNumber}`,
          400
        );
      }

      // Create the global discount code
      const code = await createGlobalDiscountCode(
        tx,
        orderNumber,
        discountPercent
      );

      if (!code) {
        generateFailureResponse('Failed to create discount code', 500);
      }

      return {
        code: code!,
        orderNumber,
        nextGlobalOrderNumber,
      };
    });

    return res.status(201).json({
      message: 'Global discount code created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


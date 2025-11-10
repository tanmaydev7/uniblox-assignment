import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema/users';
import { orders } from '../../db/schema/orders';
import { discountCodes } from '../../db/schema/discountCodes';
import { eq, and, count, inArray, isNotNull } from 'drizzle-orm';
import { generateFailureResponse } from '../../utils/errorUtils';
import { nthOrder } from '../../constants/constant';

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
    nextOrderNumber: number;
  };
}

export const getDiscounts: RequestHandler = async (
  req: Request<{}, DiscountResponse, {}, DiscountQuery>,
  res: Response<DiscountResponse>,
  next
) => {
  try {
    const mobileNo = req.query.mobileNo;

    // Validate mobile number
    if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.trim().length === 0) {
      generateFailureResponse('Mobile number is required', 400);
    }

    const trimmedMobileNo = mobileNo.trim();

    // Find or create user by mobile number
    let user = await db
      .select()
      .from(users)
      .where(eq(users.mobileNo, trimmedMobileNo))
      .limit(1);

    if (user.length === 0) {
      // Create new user if doesn't exist
      const newUser = await db
        .insert(users)
        .values({ mobileNo: trimmedMobileNo })
        .returning();
      user = newUser;
    }

    const userId = user[0].id;

    // Count user's orders
    const orderCountResult = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.userId, userId));

    const orderCount = orderCountResult[0]?.count || 0;
    const nextOrderNumber = orderCount + 1;

    // Get user's order IDs
    const userOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.userId, userId));

    const userOrderIds = userOrders.map((order) => order.id);

    // Get available discounts (not used and valid for the next order number)
    // Discount codes are created on every nth order (4th, 8th, 12th, etc. if n=4)
    // A code created on nth order is valid for orders (nthOrder + 1) through (nthOrder + nthOrder)
    // e.g., if n=4 and code created on order 4, it's valid for orders 5, 6, 7, 8
    // On the next nth order (8th), a new code is created and the old one is no longer available
    const allDiscounts = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.isUsed, false));

    // Filter discounts that are valid for the next order number
    const availableDiscounts = allDiscounts.filter((discount) => {
      const createdOnOrder = discount.orderNumber;
      const validFromOrder = createdOnOrder + 1;
      const validUntilOrder = createdOnOrder + nthOrder + 1; // Exclusive upper bound
      return nextOrderNumber >= validFromOrder && nextOrderNumber < validUntilOrder;
    });

    // Get used discounts by this user
    const usedDiscounts = userOrderIds.length > 0
      ? await db
          .select()
          .from(discountCodes)
          .where(
            and(
              isNotNull(discountCodes.usedByOrderId),
              inArray(discountCodes.usedByOrderId, userOrderIds)
            )
          )
      : [];

    // Transform to response format
    const transformDiscount = (discount: typeof discountCodes.$inferSelect): DiscountItem => ({
      id: discount.id,
      code: discount.code,
      orderNumber: discount.orderNumber,
      discountPercent: discount.discountPercent || 10,
      isUsed: discount.isUsed,
      usedByOrderId: discount.usedByOrderId,
      createdAt: discount.createdAt || '',
    });

    return res.json({
      data: {
        available: availableDiscounts.map(transformDiscount),
        used: usedDiscounts.map(transformDiscount),
        nextOrderNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};


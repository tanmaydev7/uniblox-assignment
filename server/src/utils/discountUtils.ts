import { users } from '../db/schema/users';
import { orders } from '../db/schema/orders';
import { discountCodes } from '../db/schema/discountCodes';
import { eq, and, count, inArray, isNotNull, isNull } from 'drizzle-orm';
import { generateFailureResponse } from './errorUtils';
import { db } from '../db';

/**
 * Validates and trims mobile number
 */
export const validateMobileNumber = (mobileNo?: string): string => {
  if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.trim().length === 0) {
    generateFailureResponse('Mobile number is required', 400);
  }
  return mobileNo!.trim();
};

/**
 * Finds or creates user by mobile number
 */
export const findOrCreateUser = async (mobileNo: string) => {
  let user = await db
    .select()
    .from(users)
    .where(eq(users.mobileNo, mobileNo))
    .limit(1);

  if (user.length === 0) {
    const newUser = await db
      .insert(users)
      .values({ mobileNo })
      .returning();
    user = newUser;
  }

  return user[0];
};

/**
 * Gets user's next order number
 */
export const getNextOrderNumber = async (userId: number): Promise<number> => {
  const orderCountResult = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.userId, userId));

  const orderCount = orderCountResult[0]?.count || 0;
  return orderCount + 1;
};

/**
 * Gets user's order IDs
 */
export const getUserOrderIds = async (userId: number): Promise<number[]> => {
  const userOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.userId, userId));

  return userOrders.map((order) => order.id);
};

/**
 * Gets available discount codes for user's next order
 * Available = codes that can still be applied (orderNumber matches nextOrderNumber, not used, not expired)
 */
export const getAvailableDiscountCodes = async (userId: number, nextOrderNumber: number) => {
  return await db
    .select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.userId, userId),
        eq(discountCodes.orderNumber, nextOrderNumber),
        // Only codes that haven't been applied to an order (usedByOrderId is null)
        isNull(discountCodes.usedByOrderId),
        eq(discountCodes.isUsed, false)
      )
    );
};

/**
 * Gets used discount codes by user
 * Used = codes that were actually applied to an order (usedByOrderId is not null)
 */
export const getUsedDiscountCodes = async (userId: number, userOrderIds: number[]) => {
  if (userOrderIds.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.userId, userId),
        isNotNull(discountCodes.usedByOrderId),
        inArray(discountCodes.usedByOrderId, userOrderIds)
      )
    );
};


/**
 * Transforms discount code to response format
 */
export const transformDiscount = (discount: typeof discountCodes.$inferSelect) => ({
  id: discount.id,
  code: discount.code,
  orderNumber: discount.orderNumber,
  discountPercent: discount.discountPercent || 10,
  isUsed: discount.isUsed,
  usedByOrderId: discount.usedByOrderId,
  createdAt: discount.createdAt || '',
});

/**
 * Gets user discount codes data
 */
export interface DiscountData {
  available: ReturnType<typeof transformDiscount>[];
  used: ReturnType<typeof transformDiscount>[];
  expired: ReturnType<typeof transformDiscount>[];
  nextOrderNumber: number;
}

export const getUserDiscountCodes = async (mobileNo: string): Promise<DiscountData> => {
  const trimmedMobileNo = validateMobileNumber(mobileNo);
  const user = await findOrCreateUser(trimmedMobileNo);
  const nextOrderNumber = await getNextOrderNumber(user.id);
  const userOrderIds = await getUserOrderIds(user.id);

  // Get all user's discount codes
  const allUserCodes = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.userId, user.id));

  // Separate into used, available, and expired
  const usedDiscounts = allUserCodes.filter(
    (code) => code.usedByOrderId !== null && userOrderIds.includes(code.usedByOrderId!)
  );

  const availableDiscounts = allUserCodes.filter(
    (code) =>
      code.orderNumber === nextOrderNumber &&
      code.usedByOrderId === null &&
      !code.isUsed
  );

  const expiredDiscounts = allUserCodes.filter(
    (code) =>
      code.orderNumber < nextOrderNumber &&
      code.usedByOrderId === null &&
      !code.isUsed
  );

  return {
    available: availableDiscounts.map(transformDiscount),
    used: usedDiscounts.map(transformDiscount),
    expired: expiredDiscounts.map(transformDiscount),
    nextOrderNumber,
  };
};


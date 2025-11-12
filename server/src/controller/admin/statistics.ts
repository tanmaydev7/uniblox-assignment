import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { orders } from '../../db/schema/orders';
import { orderItems } from '../../db/schema/orders';
import { discountCodes } from '../../db/schema/discountCodes';
import { users } from '../../db/schema/users';
import { sql, eq, count } from 'drizzle-orm';

type DiscountStatus = 'used' | 'available' | 'expired' | 'unknown';

interface DiscountCodeItem {
  id: number;
  code: string;
  userId: number | null;
  userMobileNo: string | null;
  orderNumber: number;
  discountPercent: number;
  isUsed: boolean;
  usedByOrderId: number | null;
  createdAt: string | null;
  status: DiscountStatus;
  isGlobalOrder: boolean;
}

interface StatisticsResponse {
  data: {
    itemsPurchased: number;
    totalPurchaseAmount: number;
    discountCodes: DiscountCodeItem[];
    totalDiscountAmount: number;
  };
}

export const getStatistics: RequestHandler = async (
  req: Request<{}, StatisticsResponse>,
  res: Response<StatisticsResponse>,
  next
) => {
  try {
    // Count total items purchased (sum of all quantities in order items)
    const itemsCountResult = await db
      .select({
        totalItems: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`.as('totalItems'),
      })
      .from(orderItems);

    const itemsPurchased = Number(itemsCountResult[0]?.totalItems || 0);

    // Calculate total purchase amount (sum of all final amounts from orders)
    const totalAmountResult = await db
      .select({
        totalAmount: sql<number>`COALESCE(SUM(${orders.finalAmount}), 0)`.as('totalAmount'),
      })
      .from(orders);

    const totalPurchaseAmount = Number(totalAmountResult[0]?.totalAmount || 0);

    // Get all discount codes with user information (left join to include global codes)
    const allDiscountCodes = await db
      .select({
        id: discountCodes.id,
        code: discountCodes.code,
        userId: discountCodes.userId,
        userMobileNo: users.mobileNo,
        orderNumber: discountCodes.orderNumber,
        discountPercent: discountCodes.discountPercent,
        isUsed: discountCodes.isUsed,
        usedByOrderId: discountCodes.usedByOrderId,
        createdAt: discountCodes.createdAt,
        isGlobalOrder: discountCodes.isGlobalOrder,
      })
      .from(discountCodes)
      .leftJoin(users, eq(discountCodes.userId, users.id))
      .orderBy(discountCodes.createdAt);

    // Get global order count
    const globalOrderCountResult = await db
      .select({ count: count() })
      .from(orders);
    const globalOrderCount = globalOrderCountResult[0]?.count || 0;
    const nextGlobalOrderNumber = globalOrderCount + 1;

    // Get order counts for all users who have discount codes
    const userIds = [...new Set(allDiscountCodes.map((dc) => dc.userId).filter((id): id is number => id !== null))];
    const userOrderCounts = new Map<number, number>();

    // Get order count for each user
    for (const userId of userIds) {
      const orderCountResult = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.userId, userId));
      const orderCount = orderCountResult[0]?.count || 0;
      userOrderCounts.set(userId, orderCount);
    }

    // Determine status for each discount code
    const discountCodesList: DiscountCodeItem[] = allDiscountCodes.map((discount) => {
      let status: DiscountStatus;
      
      if (discount.usedByOrderId !== null) {
        // Code was actually applied to an order
        status = 'used';
      } else {
        // Check if it's a global code or user-specific code
        const isGlobal = discount.userId === null || discount.isGlobalOrder;
        
        if (isGlobal) {
          // For global codes, check against global order number
          if (discount.orderNumber < nextGlobalOrderNumber) {
            status = 'expired';
          } else if (discount.orderNumber === nextGlobalOrderNumber) {
            status = 'available';
          } else {
            status = 'unknown';
          }
        } else {
          // For user-specific codes, check against user order number
          const userOrderCount = userOrderCounts.get(discount.userId!) || 0;
          const nextOrderNumber = userOrderCount + 1;
          
          if (discount.orderNumber < nextOrderNumber) {
            status = 'expired';
          } else if (discount.orderNumber === nextOrderNumber) {
            status = 'available';
          } else {
            status = 'unknown';
          }
        }
      }

      return {
        id: discount.id,
        code: discount.code,
        userId: discount.userId,
        userMobileNo: discount.userMobileNo || null,
        orderNumber: discount.orderNumber,
        discountPercent: discount.discountPercent || 10,
        isUsed: discount.isUsed,
        usedByOrderId: discount.usedByOrderId,
        createdAt: discount.createdAt || null,
        status,
        isGlobalOrder: discount.isGlobalOrder || false,
      };
    });

    // Calculate total discount amount (sum of all discount amounts from orders)
    const totalDiscountResult = await db
      .select({
        totalDiscount: sql<number>`COALESCE(SUM(${orders.discountAmount}), 0)`.as('totalDiscount'),
      })
      .from(orders);

    const totalDiscountAmount = Number(totalDiscountResult[0]?.totalDiscount || 0);

    return res.json({
      data: {
        itemsPurchased,
        totalPurchaseAmount,
        discountCodes: discountCodesList,
        totalDiscountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};


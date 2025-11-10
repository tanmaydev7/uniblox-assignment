import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { orders } from '../../db/schema/orders';
import { orderItems } from '../../db/schema/orders';
import { discountCodes } from '../../db/schema/discountCodes';
import { sql } from 'drizzle-orm';

interface DiscountCodeItem {
  id: number;
  code: string;
  orderNumber: number;
  discountPercent: number;
  isUsed: boolean;
  usedByOrderId: number | null;
  createdAt: string | null;
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

    // Get all discount codes
    const allDiscountCodes = await db
      .select()
      .from(discountCodes)
      .orderBy(discountCodes.createdAt);

    const discountCodesList: DiscountCodeItem[] = allDiscountCodes.map((discount) => ({
      id: discount.id,
      code: discount.code,
      orderNumber: discount.orderNumber,
      discountPercent: discount.discountPercent || 10,
      isUsed: discount.isUsed,
      usedByOrderId: discount.usedByOrderId,
      createdAt: discount.createdAt || null,
    }));

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


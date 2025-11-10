import { users } from '../db/schema/users';
import { cart, cartItems } from '../db/schema/cart';
import { products } from '../db/schema/products';
import { orders, orderItems } from '../db/schema/orders';
import { discountCodes } from '../db/schema/discountCodes';
import { eq, and, count, isNull } from 'drizzle-orm';
import { generateFailureResponse } from './errorUtils';
import { nthOrder } from '../constants/constant';
import { createDiscountCodeForNthOrder } from './discountCodeUtils';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import type { ResultSet } from '@libsql/client/.';
import type { ExtractTablesWithRelations } from 'drizzle-orm';

type Database = SQLiteTransaction<
  'async',
  ResultSet,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

/**
 * Validates and trims input values
 */
export const validateInputs = (mobileNo?: string, shippingAddress?: string) => {
  if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.trim().length === 0) {
    generateFailureResponse('Mobile number is required', 400);
  }

  if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length === 0) {
    generateFailureResponse('Shipping address is required', 400);
  }

  return {
    trimmedMobileNo: mobileNo!.trim(),
    trimmedShippingAddress: shippingAddress!.trim(),
  };
};

/**
 * Finds or validates user exists
 */
export const findUser = async (mobileNo: string) => {
  const { db } = await import('../db');
  const user = await db
    .select()
    .from(users)
    .where(eq(users.mobileNo, mobileNo))
    .limit(1);

  if (user.length === 0) {
    generateFailureResponse('User not found', 404);
  }

  return user[0];
};

/**
 * Gets user's cart items with product details
 */
export const getCartItems = async (tx: Database, userId: number) => {
  const userCart = await tx
    .select()
    .from(cart)
    .where(eq(cart.userId, userId))
    .limit(1);

  if (userCart.length === 0) {
    generateFailureResponse('Cart not found', 404);
  }

  const items = await tx
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      name: products.name,
      price: products.price,
      stock: products.stock,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, userId));

  if (items.length === 0) {
    generateFailureResponse('Cart is empty', 400);
  }

  return items;
};

/**
 * Validates stock availability for all cart items
 */
export const validateStock = (items: typeof cartItems.$inferSelect[]) => {
  for (const item of items) {
    if (item.stock < item.quantity) {
      generateFailureResponse(`Insufficient stock for ${item.name}`, 400);
    }
  }
};

/**
 * Calculates total amount from cart items
 */
export const calculateTotalAmount = (items: typeof cartItems.$inferSelect[]) => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

/**
 * Gets user's next order number
 */
export const getNextOrderNumber = async (tx: Database, userId: number) => {
  const orderCountResult = await tx
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.userId, userId));

  const orderCount = orderCountResult[0]?.count || 0;
  return orderCount + 1;
};

/**
 * Validates and applies discount code
 */
export const applyDiscountCode = async (
  tx: Database,
  discountCode: string,
  userId: number,
  orderNumber: number,
  totalAmount: number
) => {
  const discount = await tx
    .select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.code, discountCode),
        eq(discountCodes.userId, userId),
        // Code must not be used (usedByOrderId is null)
        isNull(discountCodes.usedByOrderId),
        // We check isUsed as well for backward compatibility
        eq(discountCodes.isUsed, false)
      )
    )
    .limit(1);

  if (discount.length === 0) {
    generateFailureResponse('Invalid or already used discount code', 400);
  }

  const discountRecord = discount[0];

  if (discountRecord.orderNumber !== orderNumber) {
    generateFailureResponse(
      `This discount code is only valid for order #${discountRecord.orderNumber}, not order #${orderNumber}`,
      400
    );
  }

  const discountAmount = (totalAmount * (discountRecord.discountPercent ?? 0)) / 100;

  return {
    discountCodeId: discountRecord.id,
    discountAmount,
    appliedDiscountCode: discountCode,
  };
};

/**
 * Creates order and order items
 */
export const createOrder = async (
  tx: Database,
  userId: number,
  totalAmount: number,
  discountAmount: number,
  appliedDiscountCode: string | null,
  shippingAddress: string,
  items: typeof cartItems.$inferSelect[]
) => {
  const finalAmount = totalAmount - discountAmount;

  const [newOrder] = await tx
    .insert(orders)
    .values({
      userId,
      totalAmount,
      discountCode: appliedDiscountCode,
      discountAmount,
      finalAmount,
      shippingAddress,
    })
    .returning();

  const orderItemsToInsert = items.map((item) => ({
    orderId: newOrder.id,
    productId: item.productId,
    quantity: item.quantity,
    priceAtPurchase: item.price,
  }));

  await tx.insert(orderItems).values(orderItemsToInsert);

  return newOrder;
};

/**
 * Updates product stock after order creation
 */
export const updateProductStock = async (
  tx: Database,
  items: typeof cartItems.$inferSelect[]
) => {
  for (const item of items) {
    await tx
      .update(products)
      .set({ stock: item.stock - item.quantity })
      .where(eq(products.id, item.productId));
  }
};

/**
 * Marks discount code as used
 */
export const markDiscountCodeAsUsed = async (
  tx: Database,
  discountCodeId: number,
  orderId: number
) => {
  const updateResult = await tx
    .update(discountCodes)
    .set({
      isUsed: true,
      usedByOrderId: orderId,
    })
    .where(
      and(
        eq(discountCodes.id, discountCodeId),
        eq(discountCodes.isUsed, false)
      )
    )
    .returning();

  if (updateResult.length === 0) {
    generateFailureResponse('Discount code was already used by another request', 400);
  }
};


/**
 * Clears user's cart
 */
export const clearCart = async (tx: Database, userId: number) => {
  await tx.delete(cartItems).where(eq(cartItems.cartId, userId));
};

/**
 * Processes checkout transaction
 */
export interface CheckoutResult {
  orderId: number;
  newDiscountCode?: string;
}

export const processCheckout = async (
  tx: Database,
  userId: number,
  shippingAddress: string,
  discountCode?: string
): Promise<CheckoutResult> => {
  // Get cart items and validate
  const items = await getCartItems(tx, userId);
  validateStock(items);

  // Calculate amounts
  const totalAmount = calculateTotalAmount(items);
  const orderNumber = await getNextOrderNumber(tx, userId);

  // Create discount code if next order will be nth order (generate on n-1th order)
  // e.g., if n=4, generate code on 3rd order for use on 4th order
  let newDiscountCode: string | undefined;
  const nextOrderNumber = orderNumber + 1;
  if (nextOrderNumber % nthOrder === 0) {
    const code = await createDiscountCodeForNthOrder(tx, userId, nextOrderNumber);
    if (code) {
      newDiscountCode = code;
    }
  }

  // Apply discount code if provided
  let discountCodeId: number | null = null;
  let discountAmount = 0;
  let appliedDiscountCode: string | null = null;

  if (discountCode) {
    const discountResult = await applyDiscountCode(
      tx,
      discountCode,
      userId,
      orderNumber,
      totalAmount
    );
    discountCodeId = discountResult.discountCodeId;
    discountAmount = discountResult.discountAmount;
    appliedDiscountCode = discountResult.appliedDiscountCode;
  }

  // Create order
  const newOrder = await createOrder(
    tx,
    userId,
    totalAmount,
    discountAmount,
    appliedDiscountCode,
    shippingAddress,
    items
  );

  // Update product stock
  await updateProductStock(tx, items);

  // Mark discount code as used if applied
  if (discountCodeId !== null) {
    await markDiscountCodeAsUsed(tx, discountCodeId, newOrder.id);
  }

  // Note: We don't mark unused codes as "used" anymore
  // Codes are only considered "used" if they were actually applied (usedByOrderId is set)
  // Codes that weren't used become "expired" when the order number passes

  // Clear cart
  await clearCart(tx, userId);

  return {
    orderId: newOrder.id,
    newDiscountCode,
  };
};


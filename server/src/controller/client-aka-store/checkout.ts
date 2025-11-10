import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema/users';
import { cart, cartItems } from '../../db/schema/cart';
import { products } from '../../db/schema/products';
import { orders, orderItems } from '../../db/schema/orders';
import { discountCodes } from '../../db/schema/discountCodes';
import { eq, and, count } from 'drizzle-orm';
import { generateFailureResponse } from '../../utils/errorUtils';
import { nthOrder } from '../../constants/constant';

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

// Generate unique discount code
const generateDiscountCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const checkout: RequestHandler = async (
  req: Request<{}, CheckoutResponse, CheckoutBody, CheckoutQuery>,
  res: Response<CheckoutResponse>,
  next
) => {
  try {
    const mobileNo = req.query.mobileNo;
    const { shippingAddress, discountCode } = req.body;

    // Validate mobile number
    if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.trim().length === 0) {
      generateFailureResponse('Mobile number is required', 400);
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length === 0) {
      generateFailureResponse('Shipping address is required', 400);
    }

    const trimmedMobileNo = mobileNo!.trim();
    const trimmedShippingAddress = shippingAddress.trim();

    // Find or create user by mobile number
    let user = await db
      .select()
      .from(users)
      .where(eq(users.mobileNo, trimmedMobileNo))
      .limit(1);

    if (user.length === 0) {
      generateFailureResponse('User not found', 404);
    }

    const userId = user[0].id;

    // Execute all checkout logic within a transaction
    const result = await db.transaction(async (tx) => {
      // Find user's cart (within transaction)
      const userCart = await tx
        .select()
        .from(cart)
        .where(eq(cart.userId, userId))
        .limit(1);

      if (userCart.length === 0) {
        generateFailureResponse('Cart not found', 404);
      }

      const cartId = userId;

      // Fetch cart items with product details (within transaction)
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
        .where(eq(cartItems.cartId, cartId));

      if (items.length === 0) {
        generateFailureResponse('Cart is empty', 400);
      }

      // Validate stock availability
      for (const item of items) {
        if (item.stock < item.quantity) {
          generateFailureResponse(`Insufficient stock for ${item.name}`, 400);
        }
      }

      // Calculate total amount
      const totalAmount = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Handle discount code if provided (within transaction to prevent race conditions)
      let discountAmount = 0;
      let appliedDiscountCode: string | null = null;
      let discountCodeId: number | null = null;


            // Count user's existing orders to determine order number (within transaction)
      const orderCountResult = await tx
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.userId, userId));

      const orderCount = orderCountResult[0]?.count || 0;
      const newOrderNumber = orderCount + 1;

      if (discountCode) {
        // Validate discount code is available and valid for this order number
        // A code created on nth order is valid for orders (nthOrder + 1) through (nthOrder + nthOrder)
        const discount = await tx
          .select()
          .from(discountCodes)
          .where(
            and(
              eq(discountCodes.code, discountCode),
              eq(discountCodes.isUsed, false)
            )
          )
          .limit(1);

        if (discount.length === 0) {
          generateFailureResponse('Invalid or already used discount code', 400);
        }

        const discountRecord = discount[0];
        const createdOnOrder = discountRecord.orderNumber;
        const validFromOrder = createdOnOrder + 1;
        const validUntilOrder = createdOnOrder + nthOrder + 1; // Exclusive upper bound

        // Check if the current order number is within the valid range
        if (newOrderNumber < validFromOrder || newOrderNumber >= validUntilOrder) {
          generateFailureResponse('Discount code is not valid for this order', 400);
        }

        discountCodeId = discountRecord.id;
        discountAmount = (totalAmount * discountRecord.discountPercent) / 100;
        appliedDiscountCode = discountCode;
      }

      const finalAmount = totalAmount - discountAmount;



      // Create order (within transaction)
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          totalAmount,
          discountCode: appliedDiscountCode,
          discountAmount,
          finalAmount,
          shippingAddress: trimmedShippingAddress,
        })
        .returning();

      const orderId = newOrder.id;

      // Create order items (within transaction)
      const orderItemsToInsert = items.map((item) => ({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
      }));

      await tx.insert(orderItems).values(orderItemsToInsert);

      // Update product stock (within transaction)
      for (const item of items) {
        await tx
          .update(products)
          .set({ stock: item.stock - item.quantity })
          .where(eq(products.id, item.productId));
      }

      // Mark discount code as used if one was applied (within transaction)
      // Use conditional update to ensure it's still unused (prevents race condition)
      if (discountCodeId !== null) {
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

        // If update didn't affect any rows, the code was already used
        if (updateResult.length === 0) {
          generateFailureResponse('Discount code was already used by another request', 400);
        }
      }

      // Clear cart (within transaction)
      await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));

      // Check if this is the nth order and create a discount code (within transaction)
      // Discount code is made available for every nth order (4th, 8th, 12th, etc. if n=4)
      // The code created on nth order is valid for the next n orders (e.g., code from 4th order valid for 5th, 6th, 7th, 8th)
      // On the next nth order (8th), a new code is created and the old one is no longer available
      let newDiscountCode: string | undefined;
      if (newOrderNumber % nthOrder === 0) {
        // Generate unique code
        let uniqueCode = generateDiscountCode();
        let codeExists = true;
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure code is unique (within transaction)
        while (codeExists && attempts < maxAttempts) {
          const existingCode = await tx
            .select()
            .from(discountCodes)
            .where(eq(discountCodes.code, uniqueCode))
            .limit(1);

          if (existingCode.length === 0) {
            codeExists = false;
          } else {
            uniqueCode = generateDiscountCode();
            attempts++;
          }
        }

        if (attempts >= maxAttempts) {
          console.error('Failed to generate unique discount code after multiple attempts');
        } else {
          // Create discount code for this nth order
          // orderNumber stores the order number on which the code was created (the nth order)
          // The code is valid for orders (newOrderNumber + 1) through (newOrderNumber + nthOrder)
          // e.g., if n=4 and code created on order 4, it's valid for orders 5, 6, 7, 8
          await tx.insert(discountCodes).values({
            code: uniqueCode,
            orderNumber: newOrderNumber, // Store the nth order number on which code was created
            discountPercent: 10, // Default 10% discount
            isUsed: false,
          });
          newDiscountCode = uniqueCode;
        }
      }

      return {
        orderId,
        newDiscountCode,
      };
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


import { Request, RequestHandler, Response } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema/users';
import { cart, cartItems } from '../../db/schema/cart';
import { products } from '../../db/schema/products';
import { eq, and } from 'drizzle-orm';
import { generateFailureResponse } from '../../utils/errorUtils';

interface CartQuery {
  mobileNo?: string;
}

interface CartItemResponse {
  id: number;
  productId: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  quantity: number;
}

interface CartResponse {
  data: {
    items: CartItemResponse[];
    mobileNo: string;
  };
}

export const getCart: RequestHandler = async (
  req: Request<{}, CartResponse, {}, CartQuery>,
  res: Response<CartResponse>,
  next
) => {
  try {
    const mobileNo = req.query.mobileNo;

    // Validate mobile number
    if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.trim().length === 0) {
      generateFailureResponse('Mobile number is required', 400);
      return
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

    // Find or create cart for user
    let userCart = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .limit(1);

    if (userCart.length === 0) {
      // Create new cart if doesn't exist
      const newCart = await db
        .insert(cart)
        .values({ userId })
        .returning();
      userCart = newCart;
    }

    const cartId = userId; // Since userId is now the primary key

    // Fetch cart items with product details
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        name: products.name,
        price: products.price,
        stock: products.stock,
        image: products.image,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cartId));

    // Transform to match CartItemResponse interface
    const cartItemsResponse: CartItemResponse[] = items.map((item) => ({
      id: item.productId,
      productId: item.productId,
      name: item.name,
      price: item.price,
      stock: item.stock,
      image: item.image,
      quantity: item.quantity,
    }));

    return res.json({
      data: {
        items: cartItemsResponse,
        mobileNo: trimmedMobileNo,
      },
    });
  } catch (error) {
    next(error);
  }
};

interface CartItemUpdate {
  productId: number;
  quantity: number;
}

interface UpdateCartBody {
  items: CartItemUpdate[];
}

interface UpdateCartResponse {
  data: {
    success: boolean;
    message: string;
  };
}

export const updateCart: RequestHandler = async (
  req: Request<{}, UpdateCartResponse, UpdateCartBody, CartQuery>,
  res: Response<UpdateCartResponse>,
  next
) => {
  try {
    const mobileNo = req.query.mobileNo;
    const { items } = req.body;

    // Validate mobile number
    if (!mobileNo || typeof mobileNo !== 'string' || mobileNo.trim().length === 0) {
      generateFailureResponse('Mobile number is required', 400);
      return
    }

    // Validate items array
    if (!Array.isArray(items)) {
      generateFailureResponse('Items must be an array', 400);
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'number' || item.productId < 1) {
        generateFailureResponse('Invalid product ID in items', 400);
      }
      if (item.quantity === undefined || typeof item.quantity !== 'number' || item.quantity < 0) {
        generateFailureResponse('Invalid quantity in items', 400);
      }
    }

    const trimmedMobileNo = mobileNo.trim();

    // Find or create user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.mobileNo, trimmedMobileNo))
      .limit(1);

    if (user.length === 0) {
      const newUser = await db
        .insert(users)
        .values({ mobileNo: trimmedMobileNo })
        .returning();
      user = newUser;
    }

    const userId = user[0].id;

    // Find or create cart
    let userCart = await db
      .select()
      .from(cart)
      .where(eq(cart.userId, userId))
      .limit(1);

    if (userCart.length === 0) {
      const newCart = await db
        .insert(cart)
        .values({ userId })
        .returning();
      userCart = newCart;
    }

    const cartId = userId; // Since userId is now the primary key

    // Delete all existing cart items
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId));

    // Insert new cart items (only items with quantity > 0)
    const itemsToInsert = items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        cartId,
        productId: item.productId,
        quantity: item.quantity,
      }));

    if (itemsToInsert.length > 0) {
      await db.insert(cartItems).values(itemsToInsert);
    }

    return res.json({
      data: {
        success: true,
        message: 'Cart updated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};


import { db } from '../../src/db';
import { products } from '../../src/db/schema/products';
import { users } from '../../src/db/schema/users';
import { adminUsers } from '../../src/db/schema/adminUsers';
import { cart, cartItems } from '../../src/db/schema/cart';
import { orders, orderItems } from '../../src/db/schema/orders';
import { discountCodes } from '../../src/db/schema/discountCodes';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const createTestProduct = async (overrides?: Partial<typeof products.$inferInsert>) => {
  const productData = {
    name: 'Test Product',
    price: 100.0,
    stock: 10,
    image: 'test-image.jpg',
    ...overrides,
  };
  const [product] = await db.insert(products).values(productData).returning();
  return product;
};

export const createTestUser = async (mobileNo: string = '1234567890') => {
  const [user] = await db.insert(users).values({ mobileNo }).returning();
  return user;
};

export const createTestAdmin = async (username: string = 'admin', password: string = 'password') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [admin] = await db.insert(adminUsers).values({ username, password: hashedPassword }).returning();
  return admin;
};

export const createTestCart = async (userId: number) => {
  const [cartData] = await db.insert(cart).values({ userId }).returning();
  return cartData;
};

export const createTestCartItem = async (cartId: number, productId: number, quantity: number = 1) => {
  const [item] = await db.insert(cartItems).values({ cartId, productId, quantity }).returning();
  return item;
};

export const createTestOrder = async (
  userId: number,
  totalAmount: number = 100,
  finalAmount: number = 100,
  shippingAddress: string = 'Test Address',
  discountCode?: string,
  discountAmount: number = 0
) => {
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      totalAmount,
      finalAmount,
      shippingAddress,
      discountCode,
      discountAmount,
    })
    .returning();
  return order;
};

export const createTestOrderItem = async (
  orderId: number,
  productId: number,
  quantity: number = 1,
  priceAtPurchase: number = 100
) => {
  const [item] = await db
    .insert(orderItems)
    .values({ orderId, productId, quantity, priceAtPurchase })
    .returning();
  return item;
};

export const createTestDiscountCode = async (
  userId: number,
  code: string,
  orderNumber: number,
  discountPercent: number = 10,
  isUsed: boolean = false,
  usedByOrderId?: number | null
) => {
  const [discount] = await db
    .insert(discountCodes)
    .values({
      userId,
      code,
      orderNumber,
      discountPercent,
      isUsed,
      usedByOrderId: usedByOrderId ?? null,
    })
    .returning();
  return discount;
};

export const generateAdminToken = (adminId: number, username: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.sign(
    {
      id: adminId,
      username,
      type: 'admin',
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};


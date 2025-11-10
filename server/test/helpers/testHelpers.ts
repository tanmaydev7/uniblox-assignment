import { db } from '../../src/db';
import { products } from '../../src/db/schema/products';
import { users } from '../../src/db/schema/users';
import { adminUsers } from '../../src/db/schema/adminUsers';
import { cart, cartItems } from '../../src/db/schema/cart';
import { orders, orderItems } from '../../src/db/schema/orders';
import { discountCodes } from '../../src/db/schema/discountCodes';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const createProduct = async (overrides: any = {}) => {
  const [product] = await db
    .insert(products)
    .values({
      name: 'Test Product',
      price: 100.0,
      stock: 10,
      image: 'test.jpg',
      ...overrides,
    })
    .returning();
  return product;
};

export const createUser = async (mobileNo?: string) => {
  // Generate unique mobile number if not provided
  const uniqueMobileNo = mobileNo || `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  const [user] = await db.insert(users).values({ mobileNo: uniqueMobileNo }).returning();
  return user;
};

export const createAdmin = async (username: string = 'admin', password: string = 'password') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [admin] = await db
    .insert(adminUsers)
    .values({ username, password: hashedPassword })
    .returning();
  return admin;
};

export const createCart = async (userId: number) => {
  const [cartData] = await db.insert(cart).values({ userId }).returning();
  return cartData;
};

export const createCartItem = async (cartId: number, productId: number, quantity: number = 1) => {
  const [item] = await db
    .insert(cartItems)
    .values({ cartId, productId, quantity })
    .returning();
  return item;
};

export const createOrder = async (userId: number, overrides: any = {}) => {
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      totalAmount: 100,
      finalAmount: 100,
      shippingAddress: 'Test Address',
      ...overrides,
    })
    .returning();
  return order;
};

export const createOrderItem = async (
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

export const createDiscountCode = async (
  userId: number,
  code: string,
  orderNumber: number,
  overrides: any = {}
) => {
  const [discount] = await db
    .insert(discountCodes)
    .values({
      userId,
      code,
      orderNumber,
      discountPercent: 10,
      isUsed: false,
      usedByOrderId: null,
      ...overrides,
    })
    .returning();
  return discount;
};

export const generateToken = (adminId: number, username: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({ id: adminId, username, type: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
};


import request from 'supertest';
import app from '../../src/index';
import {
  createUser,
  createProduct,
  createCart,
  createCartItem,
  createDiscountCode,
} from '../helpers/testHelpers';
import { db } from '../../src/db';
import { products } from '../../src/db/schema/products';
import { cartItems } from '../../src/db/schema/cart';
import { eq } from 'drizzle-orm';

describe('Checkout API', () => {
  describe('POST /api/v1/store/checkout', () => {
    it('should create order successfully', async () => {
      const user: any = await createUser('1234567890');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await createCartItem(cart.userId, product.id, 2);

      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=1234567890')
        .send({ shippingAddress: '123 Test Street' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data.message).toBe('Order created successfully');
    });

    it('should apply discount code when provided', async () => {
      const user: any = await createUser('1234567890');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await createCartItem(cart.userId, product.id, 1);
      await createDiscountCode(user.id, 'TEST10', 1);

      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=1234567890')
        .send({
          shippingAddress: '123 Test Street',
          discountCode: 'TEST10',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('orderId');
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=9999999999')
        .send({ shippingAddress: '123 Test Street' });

      expect(response.status).toBe(404);
    });

    it('should return 400 when cart is empty', async () => {
      const user = await createUser('1234567890');
      await createCart(user.id);

      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=1234567890')
        .send({ shippingAddress: '123 Test Street' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when insufficient stock', async () => {
      const user: any = await createUser('1234567890');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 2 });
      await createCartItem(cart.userId, product.id, 5);

      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=1234567890')
        .send({ shippingAddress: '123 Test Street' });

      expect(response.status).toBe(400);
    });

    it('should clear cart after checkout', async () => {
      const user: any = await createUser('1234567890');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await createCartItem(cart.userId, product.id, 1);

      await request(app)
        .post('/api/v1/store/checkout?mobileNo=1234567890')
        .send({ shippingAddress: '123 Test Street' });

      const remainingItems: any = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, (user as any).id));
      expect(remainingItems.length).toBe(0);
    });

    it('should update product stock after checkout', async () => {
      const user: any = await createUser('1234567890');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await createCartItem(cart.userId, product.id, 3);

      await request(app)
        .post('/api/v1/store/checkout?mobileNo=1234567890')
        .send({ shippingAddress: '123 Test Street' });

      const [updatedProduct]: any = await db
        .select()
        .from(products)
        .where(eq(products.id, (product as any).id));
      expect(updatedProduct.stock).toBe(7);
    });

    it('should return 400 when shipping address is missing', async () => {
      const user: any = await createUser('7777777777');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await createCartItem(cart.userId, product.id, 1);

      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=7777777777')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 when shipping address is empty', async () => {
      const user: any = await createUser('8888888888');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await createCartItem(cart.userId, product.id, 1);

      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=8888888888')
        .send({ shippingAddress: '' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when discount code is for wrong order number', async () => {
      const user: any = await createUser('9999999999');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await createCartItem(cart.userId, product.id, 1);
      // Create discount code for order 2, but this is user's first order
      await createDiscountCode(user.id, 'WRONG', 2);

      const response = await request(app)
        .post('/api/v1/store/checkout?mobileNo=9999999999')
        .send({
          shippingAddress: '123 Test Street',
          discountCode: 'WRONG',
        });

      expect(response.status).toBe(400);
    });
  });
});


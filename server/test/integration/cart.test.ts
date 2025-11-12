import request from 'supertest';
import app from '../../src/index';
import { createUser, createProduct, createCart, createCartItem } from '../helpers/testHelpers';

describe('Cart API', () => {
  describe('GET /api/v1/store/cart', () => {
    it('should return cart with items', async () => {
      const user: any = await createUser('1234567890');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100 });
      await createCartItem(cart.userId, product.id, 2);

      const response = await request(app).get('/api/v1/store/cart?mobileNo=1234567890');

      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.mobileNo).toBe('1234567890');
    });

    it('should create user and cart if they do not exist', async () => {
      const response = await request(app).get('/api/v1/store/cart?mobileNo=9999999999');

      expect(response.status).toBe(200);
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.mobileNo).toBe('9999999999');
    });

    it('should return 400 when mobile number is missing', async () => {
      const response = await request(app).get('/api/v1/store/cart');

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/store/cart', () => {
    it('should update cart with new items', async () => {
      const user: any = await createUser('1234567890');
      await createCart(user.id);
      const product1: any = await createProduct({ name: 'Product 1', price: 100 });
      const product2: any = await createProduct({ name: 'Product 2', price: 200 });

      const response = await request(app)
        .put('/api/v1/store/cart?mobileNo=1234567890')
        .send({
          items: [
            { productId: product1.id, quantity: 3 },
            { productId: product2.id, quantity: 2 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);

      // Verify cart was updated
      const getResponse = await request(app).get('/api/v1/store/cart?mobileNo=1234567890');
      expect(getResponse.body.data.items.length).toBe(2);
    });

    it('should remove items with quantity 0', async () => {
      const user: any = await createUser('1234567890');
      const cart: any = await createCart(user.id);
      const product: any = await createProduct({ name: 'Product 1', price: 100 });
      await createCartItem(cart.userId, product.id, 2);

      const response = await request(app)
        .put('/api/v1/store/cart?mobileNo=1234567890')
        .send({
          items: [{ productId: product.id, quantity: 0 }],
        });

      expect(response.status).toBe(200);

      const getResponse = await request(app).get('/api/v1/store/cart?mobileNo=1234567890');
      expect(getResponse.body.data.items.length).toBe(0);
    });

    it('should return 400 when items is not an array', async () => {
      const response = await request(app)
        .put('/api/v1/store/cart?mobileNo=1234567890')
        .send({ items: 'not-an-array' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when productId is invalid', async () => {
      const response = await request(app)
        .put('/api/v1/store/cart?mobileNo=1234567890')
        .send({
          items: [{ productId: 0, quantity: 1 }],
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 when quantity is negative', async () => {
      const product: any = await createProduct({ name: 'Product 1', price: 100 });

      const response = await request(app)
        .put('/api/v1/store/cart?mobileNo=1234567890')
        .send({
          items: [{ productId: product.id, quantity: -1 }],
        });

      expect(response.status).toBe(400);
    });

    it('should create user and cart if they do not exist', async () => {
      const product: any = await createProduct({ name: 'Product 1', price: 100 });

      const response = await request(app)
        .put('/api/v1/store/cart?mobileNo=5555555555')
        .send({
          items: [{ productId: product.id, quantity: 1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);
    });

    it('should handle empty items array', async () => {
      const user: any = await createUser('6666666666');
      await createCart(user.id);

      const response = await request(app)
        .put('/api/v1/store/cart?mobileNo=6666666666')
        .send({ items: [] });

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);
    });
  });
});


import request from 'supertest';
import app from '../../src/index';
import {
  createAdmin,
  createUser,
  createProduct,
  createOrder,
  createOrderItem,
  createDiscountCode,
  generateToken,
} from '../helpers/testHelpers';

describe('Admin API', () => {
  describe('POST /api/v1/admin/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const admin: any = await createAdmin('admin', 'password123');

      const response = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({
          username: 'admin',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.admin.id).toBe(admin.id);
      expect(response.body.admin.username).toBe('admin');
    });

    it('should return 401 with invalid credentials', async () => {
      await createAdmin('admin', 'password123');

      const response = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/admin/statistics', () => {
    let adminToken: any;

    beforeEach(async () => {
      const admin: any = await createAdmin('admin', 'password123');
      adminToken = generateToken(admin.id, admin.username);
    });

    it('should return statistics with valid token', async () => {
      const user1 = await createUser('1111111111');
      const user2 = await createUser('2222222222');
      const product = await createProduct({ name: 'Product 1', price: 100 });

      const order1 = await createOrder(user1.id, { totalAmount: 100, finalAmount: 100 });
      const order2 = await createOrder(user2.id, { totalAmount: 200, finalAmount: 200 });
      await createOrderItem(order1.id, product.id, 1, 100);
      await createOrderItem(order2.id, product.id, 2, 100);

      const response = await request(app)
        .get('/api/v1/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.itemsPurchased).toBe(3);
      expect(response.body.data.totalPurchaseAmount).toBe(300);
      expect(response.body.data).toHaveProperty('discountCodes');
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app).get('/api/v1/admin/statistics');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/admin/statistics')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should handle statistics with multiple users and discount codes', async () => {
      const user1: any = await createUser('3333333333');
      const user2: any = await createUser('4444444444');
      const product: any = await createProduct({ name: 'Product 1', price: 100 });

      const order1: any = await createOrder(user1.id, { totalAmount: 100, finalAmount: 100 });
      const order2: any = await createOrder(user2.id, { totalAmount: 200, finalAmount: 200 });
      await createOrderItem(order1.id, product.id, 1, 100);
      await createOrderItem(order2.id, product.id, 2, 100);

      // Create discount codes for different statuses
      await createDiscountCode(user1.id, 'CODE1', 1);
      await createDiscountCode(user1.id, 'CODE2', 2);
      await createDiscountCode(user1.id, 'CODE3', 1, { isUsed: true, usedByOrderId: order1.id });

      const response = await request(app)
        .get('/api/v1/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.discountCodes.length).toBeGreaterThan(0);
      
      // Check that statuses are correctly assigned
      const codes = response.body.data.discountCodes;
      const usedCode = codes.find((c: any) => c.code === 'CODE3');
      expect(usedCode).toBeDefined();
      expect(usedCode.status).toBe('used');
    });

    it('should handle statistics with discount codes in different states', async () => {
      const user: any = await createUser('5555555555');
      const product: any = await createProduct({ name: 'Product 1', price: 100 });

      // Create order 1
      const order1: any = await createOrder(user.id, { totalAmount: 100, finalAmount: 100 });
      await createOrderItem(order1.id, product.id, 1, 100);

      // Create discount codes for different statuses
      // Available code (for order 2, which is next)
      await createDiscountCode(user.id, 'AVAIL1', 2);
      // Expired code (for order 1, but we already have order 1)
      await createDiscountCode(user.id, 'EXPIRED1', 1);
      // Used code
      await createDiscountCode(user.id, 'USED1', 1, { isUsed: true, usedByOrderId: order1.id });
      // Future code (for order 3, which is after next order)
      await createDiscountCode(user.id, 'FUTURE1', 3);

      const response = await request(app)
        .get('/api/v1/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const codes = response.body.data.discountCodes;
      
      const availCode = codes.find((c: any) => c.code === 'AVAIL1');
      const expiredCode = codes.find((c: any) => c.code === 'EXPIRED1');
      const usedCode = codes.find((c: any) => c.code === 'USED1');
      const futureCode = codes.find((c: any) => c.code === 'FUTURE1');

      expect(availCode.status).toBe('available');
      expect(expiredCode.status).toBe('expired');
      expect(usedCode.status).toBe('used');
      expect(futureCode.status).toBe('unknown');
    });
  });
});


import request from 'supertest';
import app from '../../src/index';
import { createUser, createDiscountCode, createOrder } from '../helpers/testHelpers';

describe('Discounts API', () => {
  describe('GET /api/v1/store/discounts', () => {
    it('should return discount codes for user', async () => {
      const user: any = await createUser('1111111111');
      await createDiscountCode(user.id, 'CODE1', 1);
      await createDiscountCode(user.id, 'CODE2', 2);

      const response = await request(app).get('/api/v1/store/discounts?mobileNo=1111111111');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('available');
      expect(response.body.data).toHaveProperty('used');
      expect(response.body.data).toHaveProperty('expired');
      expect(response.body.data.nextOrderNumber).toBe(1);
    });

    it('should categorize discount codes correctly', async () => {
      const user: any = await createUser('2222222222');
      
      // Create available code for next order (order 1)
      await createDiscountCode(user.id, 'CODE1', 1);
      
      // Create order 1
      const order1: any = await createOrder(user.id);
      
      // Create used code (was used in order 1)
      await createDiscountCode(user.id, 'CODE2', 1, { isUsed: true, usedByOrderId: order1.id });
      
      // Create expired code (for order 1, but we're past that now)
      await createDiscountCode(user.id, 'CODE3', 1);

      const response = await request(app).get('/api/v1/store/discounts?mobileNo=2222222222');

      expect(response.status).toBe(200);
      // CODE1 should be expired (for order 1, but user already has order 1)
      // CODE2 should be used
      // CODE3 should be expired (for order 1, but user already has order 1)
      expect(response.body.data.used.length).toBe(1);
      expect(response.body.data.expired.length).toBe(2);
    });

    it('should return 400 when mobile number is missing', async () => {
      const response = await request(app).get('/api/v1/store/discounts');

      expect(response.status).toBe(400);
    });
  });
});


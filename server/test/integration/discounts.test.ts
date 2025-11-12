import request from 'supertest';
import app from '../../src/index';
import { createUser, createDiscountCode, createOrder, createGlobalDiscountCode } from '../helpers/testHelpers';
import { db } from '../../src/db';
import { orders } from '../../src/db/schema/orders';
import { count } from 'drizzle-orm';

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

    it('should include global discount codes in response', async () => {
      const user: any = await createUser('3333333333');
      
      // Create an order first to establish a baseline
      await createOrder(user.id);
      
      // Get current global order count after creating the order
      const globalOrderCountResult = await db
        .select({ count: count() })
        .from(orders);
      const globalOrderCount = globalOrderCountResult[0]?.count || 0;
      const nextGlobalOrderNumber = globalOrderCount + 1;
      
      // Create user-specific code
      await createDiscountCode(user.id, 'USERCODE1', 1);
      
      // Create global discount code for next global order (available)
      await createGlobalDiscountCode('GLOBALCODE1', nextGlobalOrderNumber);
      
      // Create global discount code for a past global order (expired)
      await createGlobalDiscountCode('GLOBALCODE2', globalOrderCount);

      const response = await request(app).get('/api/v1/store/discounts?mobileNo=3333333333');

      expect(response.status).toBe(200);
      // Should include both user-specific and global codes
      const allCodes = [
        ...response.body.data.available,
        ...response.body.data.used,
        ...response.body.data.expired,
      ];
      
      const globalCode1 = allCodes.find((c: any) => c.code === 'GLOBALCODE1');
      const globalCode2 = allCodes.find((c: any) => c.code === 'GLOBALCODE2');
      const userCode1 = allCodes.find((c: any) => c.code === 'USERCODE1');
      
      expect(globalCode1).toBeDefined();
      expect(globalCode1).toEqual(expect.objectContaining({
        code: 'GLOBALCODE1',
        orderNumber: nextGlobalOrderNumber,
      }));
      expect(globalCode2).toBeDefined();
      expect(globalCode2).toEqual(expect.objectContaining({
        code: 'GLOBALCODE2',
        orderNumber: globalOrderCount,
      }));
      expect(userCode1).toBeDefined();
      
      // Verify GLOBALCODE1 is in available (for next global order)
      const availGlobalCode = response.body.data.available.find((c: any) => c.code === 'GLOBALCODE1');
      expect(availGlobalCode).toBeDefined();
      
      // Verify GLOBALCODE2 is in expired (for past global order)
      const expiredGlobalCode = response.body.data.expired.find((c: any) => c.code === 'GLOBALCODE2');
      expect(expiredGlobalCode).toBeDefined();
    });

    it('should categorize global discount codes correctly based on global order number', async () => {
      const user: any = await createUser('4444444444');
      
      // Create an order first to establish a baseline
      const order1: any = await createOrder(user.id);
      
      // Get current global order count after creating the order
      const globalOrderCountResult = await db
        .select({ count: count() })
        .from(orders);
      const globalOrderCount = globalOrderCountResult[0]?.count || 0;
      const nextGlobalOrderNumber = globalOrderCount + 1;
      
      // Create available global code (for next global order)
      await createGlobalDiscountCode('GLOBALAVAIL', nextGlobalOrderNumber);
      
      // Create expired global code (for a past global order - the one we just created)
      await createGlobalDiscountCode('GLOBALEXPIRED', globalOrderCount);
      
      // Create used global code (for the order we just created)
      await createGlobalDiscountCode('GLOBALUSED', globalOrderCount, {
        isUsed: true,
        usedByOrderId: order1.id,
      });

      const response = await request(app).get('/api/v1/store/discounts?mobileNo=4444444444');

      expect(response.status).toBe(200);
      
      const availCode = response.body.data.available.find((c: any) => c.code === 'GLOBALAVAIL');
      const usedCode = response.body.data.used.find((c: any) => c.code === 'GLOBALUSED');
      const expiredCode = response.body.data.expired.find((c: any) => c.code === 'GLOBALEXPIRED');
      
      expect(availCode).toBeDefined();
      expect(usedCode).toBeDefined();
      expect(expiredCode).toBeDefined();
    });

    it('should show global discount codes to all users', async () => {
      const user1: any = await createUser('5555555555');
      const user2: any = await createUser('6666666666');
      
      // Get current global order count
      const globalOrderCountResult = await db
        .select({ count: count() })
        .from(orders);
      const globalOrderCount = globalOrderCountResult[0]?.count || 0;
      const nextGlobalOrderNumber = globalOrderCount + 1;
      
      // Create global discount code
      await createGlobalDiscountCode('SHAREDCODE', nextGlobalOrderNumber);
      
      // Create user-specific code for user1
      await createDiscountCode(user1.id, 'USER1CODE', 1);

      const response1 = await request(app).get('/api/v1/store/discounts?mobileNo=5555555555');
      const response2 = await request(app).get('/api/v1/store/discounts?mobileNo=6666666666');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Both users should see the global code
      const allCodes1 = [
        ...response1.body.data.available,
        ...response1.body.data.used,
        ...response1.body.data.expired,
      ];
      const allCodes2 = [
        ...response2.body.data.available,
        ...response2.body.data.used,
        ...response2.body.data.expired,
      ];
      
      const globalCode1 = allCodes1.find((c: any) => c.code === 'SHAREDCODE');
      const globalCode2 = allCodes2.find((c: any) => c.code === 'SHAREDCODE');
      
      expect(globalCode1).toBeDefined();
      expect(globalCode2).toBeDefined();
      
      // User1 should also see their user-specific code
      const userCode1 = allCodes1.find((c: any) => c.code === 'USER1CODE');
      expect(userCode1).toBeDefined();
      
      // User2 should not see user1's code
      const userCode2 = allCodes2.find((c: any) => c.code === 'USER1CODE');
      expect(userCode2).toBeUndefined();
    });

    it('should return 400 when mobile number is missing', async () => {
      const response = await request(app).get('/api/v1/store/discounts');

      expect(response.status).toBe(400);
    });
  });
});


import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { db } from '../src/db';
import { products } from '../src/db/schema/products';
import { users } from '../src/db/schema/users';
import { adminUsers } from '../src/db/schema/adminUsers';
import { cart, cartItems } from '../src/db/schema/cart';
import { orders, orderItems } from '../src/db/schema/orders';
import { discountCodes } from '../src/db/schema/discountCodes';
import * as fs from 'fs';

// Set test database URL before any imports
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:test.db';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const TEST_DB_PATH = process.env.TEST_DATABASE_URL.replace('file:', '');

// Clean up test database file before all tests
beforeAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

// Clean up database after each test
afterEach(async () => {
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(cartItems);
    await db.delete(cart);
    await db.delete(discountCodes);
    await db.delete(products);
    await db.delete(users);
    await db.delete(adminUsers);
  } catch (error) {
    // Ignore errors during cleanup
    console.error('Cleanup error:', error);
  }
});

// Clean up test database file after all tests
afterAll(async () => {
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Ignore errors if file is locked
    }
  }
});


import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { db, client } from '../src/db';
import { products } from '../src/db/schema/products';
import { users } from '../src/db/schema/users';
import { adminUsers } from '../src/db/schema/adminUsers';
import { cart, cartItems } from '../src/db/schema/cart';
import { orders, orderItems } from '../src/db/schema/orders';
import { discountCodes } from '../src/db/schema/discountCodes';
import * as fs from 'fs';
import * as path from 'path';

// Set test database URL before any imports
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:test.db';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const TEST_DB_PATH = process.env.TEST_DATABASE_URL.replace('file:', '');

// Clean up test database file and recreate tables before all tests
beforeAll(async () => {
  // Drop all tables in reverse order of dependencies to avoid foreign key constraints
  const tablesToDrop = [
    'order_items',
    'orders',
    'cart_items',
    'cart',
    'discount_codes',
    'products',
    'users',
    'admin_users'
  ];
  
  // Drop tables if they exist (ignore errors if they don't exist)
  for (const table of tablesToDrop) {
    try {
      await client.execute(`DROP TABLE IF EXISTS ${table}`);
    } catch (error) {
      // Ignore errors - table might not exist
    }
  }
  
  // Read and execute the migration SQL to create tables
  const migrationPath = path.join(__dirname, '../drizzle/0000_sparkling_white_queen.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by statement breakpoint and clean up statements
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map(stmt => {
      // Remove breakpoint comment if on same line
      return stmt.replace(/--> statement-breakpoint/g, '').trim();
    })
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && (stmt.includes('CREATE TABLE') || stmt.includes('CREATE UNIQUE INDEX')));
  
  // Execute each statement
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await client.execute(statement);
      } catch (error) {
        // Log error and throw - tables should be clean now
        console.error('Error executing migration statement:', error);
        throw error;
      }
    }
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


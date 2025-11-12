import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { cart, cartItems } from "./schema/cart"
import dotenv from "dotenv"

dotenv.config({
  path: "../.env"
}); // Load environment variables

// Use test database when running tests (NODE_ENV=test), otherwise use production DATABASE_URL
const DATABASE_URL = process.env.NODE_ENV === 'test' 
  ? process.env.TEST_DATABASE_URL 
  : process.env.DATABASE_URL;

// For connecting to a remote Turso database or test database
export const client = createClient({
  url: DATABASE_URL!,
});

// You can specify any property from the libsql connection options
export const db = drizzle({ client})


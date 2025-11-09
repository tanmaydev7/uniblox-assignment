import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { products }  from "./schema/products"
import { discountCodes }  from "./schema/discountCodes"
import { orderItems, orders }  from "./schema/orders"
import dotenv from "dotenv"

dotenv.config(); // Load environment variables

const DATABASE_URL = process.env.DATABASE_URL

// import dotenv from "dotenv";

// dotenv.config(); // Load environment variables

// For connecting to a remote Turso database
const client = createClient({
  url: DATABASE_URL!,
});

// You can specify any property from the libsql connection options
export const db = drizzle({ client})

// , schema: {
//   products,
//   orders,
//   orderItems,
//   discountCodes
// }});

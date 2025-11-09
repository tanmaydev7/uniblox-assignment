import { defineConfig } from "drizzle-kit";

import dotenv from "dotenv"
dotenv.config(); // Load environment variables

const DATABASE_URL = process.env.DATABASE_URL


export default defineConfig({
  dialect: 'sqlite', // 'mysql' | 'sqlite' | 'turso'
  schema: './src/db/schema',
  dbCredentials: {
    url: DATABASE_URL!
  }
})

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { products } from "./products";


// ---- ORDERS ----
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  totalAmount: real("total_amount").notNull(),
  discountCode: text("discount_code"), // null if no discount used
  discountAmount: real("discount_amount").default(0),
  finalAmount: real("final_amount").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ---- ORDER ITEMS ----
// Stores products + quantities for each order
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  priceAtPurchase: real("price_at_purchase").notNull(), // price snapshot
});
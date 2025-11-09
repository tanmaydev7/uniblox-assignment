import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { orders } from "./orders";

// ---- DISCOUNT CODES ----
// Links back to order that used it (nullable before used)
export const discountCodes = sqliteTable("discount_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").unique().notNull(),
  orderNumber: integer("order_number").notNull(), // nth order rule
  discountPercent: real("discount_percent").default(10),
  isUsed: integer("is_used", { mode: "boolean" }).default(false).notNull(),
  usedByOrderId: integer("used_by_order_id")
    .references(() => orders.id, { onDelete: "set null" })
    .default(null),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
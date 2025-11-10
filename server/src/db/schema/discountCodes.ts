import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { orders } from "./orders";
import { users } from "./users";

// ---- DISCOUNT CODES ----
// Links back to order that used it (nullable before used)
// Belongs to a specific user and can only be used for their nth order
export const discountCodes = sqliteTable("discount_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").unique().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderNumber: integer("order_number").notNull(), // nth order for this user (e.g., 4, 8, 12)
  discountPercent: real("discount_percent").default(10),
  isUsed: integer("is_used", { mode: "boolean" }).default(false).notNull(),
  usedByOrderId: integer("used_by_order_id")
    .references(() => orders.id, { onDelete: "set null" })
    .default(null as any),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  deliveryZone: text('delivery_zone').notNull(), // 'inside_dhaka' | 'outside_dhaka'
  productName: text('product_name').notNull(),
  selectedItemsJson: text('selected_items_json').notNull(), // JSON array of selected codes & quantities
  totalQuantity: integer('total_quantity').notNull().default(1),
  subtotal: integer('subtotal').notNull(),
  deliveryCharge: integer('delivery_charge').notNull(),
  totalPrice: integer('total_price').notNull(),
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Confirmed' | 'Shipped' | 'Cancelled'
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

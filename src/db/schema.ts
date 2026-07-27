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

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  regularPrice: integer('regular_price').notNull().default(450),
  offerPrice: integer('offer_price').notNull().default(250),
  image: text('image').notNull(),
  inStock: integer('in_stock', { mode: 'number' }).notNull().default(1),
  createdAt: text('created_at').notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;


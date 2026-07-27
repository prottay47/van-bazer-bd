import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'sqlite.db');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Ensure database table schemas are ready
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    delivery_zone TEXT NOT NULL,
    product_name TEXT NOT NULL,
    selected_items_json TEXT NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 1,
    subtotal INTEGER NOT NULL,
    delivery_charge INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    regular_price INTEGER NOT NULL DEFAULT 450,
    offer_price INTEGER NOT NULL DEFAULT 250,
    image TEXT NOT NULL,
    in_stock INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });

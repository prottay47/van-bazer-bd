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

// Seed default products if empty
const countRow = sqlite.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (countRow.count === 0) {
  const insertStmt = sqlite.prepare(`
    INSERT INTO products (id, code, title, regular_price, offer_price, image, in_stock, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialProducts = [
    {
      id: 'mat_1',
      code: 'Code: 01',
      title: '3D Floor Mat Code-1 (বর্ডার সেলাই করা)',
      regularPrice: 450,
      offerPrice: 250,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mat_2',
      code: 'Code: 02',
      title: '3D Floor Mat Code-2 (বর্ডার সেলাই করা)',
      regularPrice: 450,
      offerPrice: 250,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mat_9',
      code: 'Code: 09',
      title: '3D Floor Mat Code-09 (রেড ফ্লাওয়ার 3D)',
      regularPrice: 450,
      offerPrice: 250,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mat_18',
      code: 'Code: 18',
      title: '3D Floor Mat Code-18 (রয়েল ব্লু রোজ)',
      regularPrice: 450,
      offerPrice: 250,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mat_24',
      code: 'Code: 24',
      title: '3D Floor Mat Code-24 (গোল্ডেন মোজাইক)',
      regularPrice: 450,
      offerPrice: 250,
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 'mat_35',
      code: 'Code: 35',
      title: '3D Floor Mat Code-35 (মার্বেল টেক্সচার)',
      regularPrice: 450,
      offerPrice: 250,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const now = new Date().toISOString();
  for (const p of initialProducts) {
    insertStmt.run(p.id, p.code, p.title, p.regularPrice, p.offerPrice, p.image, 1, now);
  }
}

export const db = drizzle(sqlite, { schema });

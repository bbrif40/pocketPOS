/**
 * PocketPOS — SQLite database singleton & data access layer
 * Opens (or creates) the local database, runs migrations, seeds initial vendor/user,
 * and provides typed helper queries for products, sales, stock, and expenses.
 */

import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import type {
  Product,
  Sale,
  SaleItem,
  PaymentMethod,
  StockAdjustmentReason,
  Expense,
} from '@shared/types';
import { getEntitlements } from '../entitlements/entitlements';

let _db: SQLite.SQLiteDatabase | null = null;

export const DEFAULT_VENDOR_ID = 'vendor_default';
export const DEFAULT_USER_ID = 'user_default';

/** Open the database, run schema setup, and seed defaults if empty. */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  const db = await SQLite.openDatabaseAsync('pocketpos.db');

  // Run all CREATE TABLE statements
  await db.execAsync(CREATE_TABLES_SQL);

  // Seed default vendor and user if missing
  await seedInitialData(db);

  _db = db;
  return db;
}

/** Get the already-open database. Throws if openDatabase() hasn't been called. */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Call openDatabase() first.');
  }
  return _db;
}

async function seedInitialData(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  // Check vendor
  const vendor = await db.getFirstAsync<{ id: string }>('SELECT id FROM vendors WHERE id = ?', [
    DEFAULT_VENDOR_ID,
  ]);
  if (!vendor) {
    await db.runAsync(
      `INSERT INTO vendors (id, business_name, owner_user_id, plan, created_at)
       VALUES (?, ?, ?, 'free', ?)`,
      [DEFAULT_VENDOR_ID, 'Anya & Maya Sari-Sari Store', DEFAULT_USER_ID, now],
    );
  }

  // Check user
  const user = await db.getFirstAsync<{ id: string }>('SELECT id FROM users WHERE id = ?', [
    DEFAULT_USER_ID,
  ]);
  if (!user) {
    await db.runAsync(
      `INSERT INTO users (id, vendor_id, phone, email, role, created_at)
       VALUES (?, ?, '+63 917 555 0192', 'vendor@pocketpos.ph', 'owner', ?)`,
      [DEFAULT_USER_ID, DEFAULT_VENDOR_ID, now],
    );
  }

  // Check categories
  const catCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM product_categories',
  );
  if (!catCount || catCount.count === 0) {
    const cats = [
      { id: 'cat_bakery', name: 'Bakery' },
      { id: 'cat_beverages', name: 'Beverages' },
      { id: 'cat_pantry', name: 'Pantry' },
      { id: 'cat_snacks', name: 'Snacks' },
    ];
    for (const c of cats) {
      await db.runAsync('INSERT INTO product_categories (id, vendor_id, name) VALUES (?, ?, ?)', [
        c.id,
        DEFAULT_VENDOR_ID,
        c.name,
      ]);
    }
  }

  // Check products
  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products');
  if (!count || count.count === 0) {
    const starterProducts = [
      {
        id: 'prod_1',
        name: 'Pandesal (Pack of 10)',
        price: 45.0,
        cost_price: 28.0,
        category_id: 'cat_bakery',
        stock_qty: 24,
        reorder_threshold: 5,
      },
      {
        id: 'prod_2',
        name: 'Barako Brewed Coffee',
        price: 35.0,
        cost_price: 18.0,
        category_id: 'cat_beverages',
        stock_qty: 30,
        reorder_threshold: 6,
      },
      {
        id: 'prod_3',
        name: 'Instant Pancit Canton',
        price: 22.0,
        cost_price: 15.0,
        category_id: 'cat_pantry',
        stock_qty: 40,
        reorder_threshold: 10,
      },
      {
        id: 'prod_4',
        name: 'Mineral Water 500ml',
        price: 18.0,
        cost_price: 10.0,
        category_id: 'cat_beverages',
        stock_qty: 15,
        reorder_threshold: 5,
      },
      {
        id: 'prod_5',
        name: 'Banana Cue (2 sticks)',
        price: 30.0,
        cost_price: 16.0,
        category_id: 'cat_snacks',
        stock_qty: 8,
        reorder_threshold: 5,
      },
    ];

    for (const p of starterProducts) {
      await db.runAsync(
        `INSERT INTO products (id, vendor_id, name, price, cost_price, category_id, stock_qty, reorder_threshold, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          DEFAULT_VENDOR_ID,
          p.name,
          p.price,
          p.cost_price,
          p.category_id,
          p.stock_qty,
          p.reorder_threshold,
          now,
        ],
      );
    }
  }
}

// ─────────────────────────────────────────────
// Typed Helper Queries
// ─────────────────────────────────────────────

export interface ProductWithCategory extends Product {
  category_name?: string | null;
}

export async function fetchProducts(includeArchived = false): Promise<ProductWithCategory[]> {
  const db = getDatabase();
  const sql = `
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN product_categories c ON p.category_id = c.id
    WHERE ${includeArchived ? '1=1' : 'p.archived_at IS NULL'}
    ORDER BY p.name ASC
  `;
  return await db.getAllAsync<ProductWithCategory>(sql);
}

export async function fetchProductCount(): Promise<number> {
  const db = getDatabase();
  const res = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM products WHERE archived_at IS NULL',
  );
  return res?.count ?? 0;
}

export async function fetchProductById(id: string): Promise<ProductWithCategory | null> {
  const db = getDatabase();
  return await db.getFirstAsync<ProductWithCategory>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN product_categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id],
  );
}

export async function saveProduct(data: {
  id?: string;
  name: string;
  price: number;
  cost_price?: number | null;
  category_id?: string | null;
  stock_qty: number;
  reorder_threshold?: number;
}): Promise<string> {
  const db = getDatabase();
  const now = new Date().toISOString();

  if (data.id) {
    await db.runAsync(
      `UPDATE products
       SET name = ?, price = ?, cost_price = ?, category_id = ?, stock_qty = ?, reorder_threshold = ?
       WHERE id = ?`,
      [
        data.name,
        data.price,
        data.cost_price ?? null,
        data.category_id ?? null,
        data.stock_qty,
        data.reorder_threshold ?? 5,
        data.id,
      ],
    );
    return data.id;
  } else {
    const id = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await db.runAsync(
      `INSERT INTO products (id, vendor_id, name, price, cost_price, category_id, stock_qty, reorder_threshold, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        DEFAULT_VENDOR_ID,
        data.name,
        data.price,
        data.cost_price ?? null,
        data.category_id ?? null,
        data.stock_qty,
        data.reorder_threshold ?? 5,
        now,
      ],
    );
    return id;
  }
}

export async function archiveProduct(id: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE products SET archived_at = ? WHERE id = ?', [
    new Date().toISOString(),
    id,
  ]);
}

export async function adjustStock(
  productId: string,
  deltaQty: number,
  reason: StockAdjustmentReason,
): Promise<number> {
  const db = getDatabase();
  const now = new Date().toISOString();
  const adjId = `adj_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO stock_adjustments (id, product_id, delta_qty, reason, created_at, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adjId, productId, deltaQty, reason, now, DEFAULT_USER_ID],
    );
    await db.runAsync('UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?', [
      deltaQty,
      productId,
    ]);
  });

  const updated = await db.getFirstAsync<{ stock_qty: number }>(
    'SELECT stock_qty FROM products WHERE id = ?',
    [productId],
  );
  return updated?.stock_qty ?? 0;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export async function recordSale(params: {
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
}): Promise<{ saleId: string; createdAt: string }> {
  const db = getDatabase();
  const now = new Date().toISOString();
  const saleId = `sale_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const entitlements = getEntitlements();

  await db.withTransactionAsync(async () => {
    // 1. Insert sale record
    await db.runAsync(
      `INSERT INTO sales (id, vendor_id, branch_id, user_id, total_amount, payment_method, created_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?)`,
      [saleId, DEFAULT_VENDOR_ID, DEFAULT_USER_ID, params.totalAmount, params.paymentMethod, now],
    );

    // 2. Insert line items
    for (const item of params.items) {
      const lineItemId = `si_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const lineTotal = item.quantity * item.product.price;
      await db.runAsync(
        `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [lineItemId, saleId, item.product.id, item.quantity, item.product.price, lineTotal],
      );

      // Auto stock deduction if entitled
      if (entitlements.autoStockDeduction) {
        const adjId = `adj_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        await db.runAsync(
          `INSERT INTO stock_adjustments (id, product_id, delta_qty, reason, created_at, created_by_user_id)
           VALUES (?, ?, ?, 'sale', ?, ?)`,
          [adjId, item.product.id, -item.quantity, now, DEFAULT_USER_ID],
        );
        await db.runAsync('UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?', [
          item.quantity,
          item.product.id,
        ]);
      }
    }
  });

  return { saleId, createdAt: now };
}

export interface TodayStats {
  totalSales: number;
  transactionCount: number;
  avgOrderValue: number;
  estimatedProfit: number | null; // null if free tier
  sales: (Sale & { items_count: number })[];
}

export async function fetchTodayStats(): Promise<TodayStats> {
  const db = getDatabase();
  const entitlements = getEntitlements();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();

  const totalRes = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
     FROM sales
     WHERE created_at >= ?`,
    [startIso],
  );

  const total = totalRes?.total ?? 0;
  const count = totalRes?.count ?? 0;
  const avg = count > 0 ? total / count : 0;

  // Profit computation for Basic+
  let profit: number | null = null;
  if (entitlements.autoProfitCalc) {
    const profitRes = await db.getFirstAsync<{ profit: number }>(
      `SELECT COALESCE(SUM((si.unit_price - COALESCE(p.cost_price, 0)) * si.quantity), 0) as profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       LEFT JOIN products p ON si.product_id = p.id
       WHERE s.created_at >= ?`,
      [startIso],
    );
    profit = profitRes?.profit ?? 0;
  }

  const sales = await db.getAllAsync<Sale & { items_count: number }>(
    `SELECT s.*, (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = s.id) as items_count
     FROM sales s
     WHERE s.created_at >= ?
     ORDER BY s.created_at DESC`,
    [startIso],
  );

  return {
    totalSales: total,
    transactionCount: count,
    avgOrderValue: avg,
    estimatedProfit: profit,
    sales,
  };
}

export interface SaleWithDetails extends Sale {
  items: (SaleItem & { product_name: string })[];
}

export async function fetchSalesHistory(limitDays?: number): Promise<SaleWithDetails[]> {
  const db = getDatabase();
  const entitlements = getEntitlements();
  const retentionDays = limitDays ?? entitlements.dataRetentionDays;

  let query = 'SELECT * FROM sales ';
  const params: string[] = [];

  if (retentionDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    query += 'WHERE created_at >= ? ';
    params.push(cutoff.toISOString());
  }
  query += 'ORDER BY created_at DESC LIMIT 100';

  const sales = await db.getAllAsync<Sale>(query, params);
  const result: SaleWithDetails[] = [];

  for (const s of sales) {
    const items = await db.getAllAsync<SaleItem & { product_name: string }>(
      `SELECT si.*, COALESCE(p.name, 'Archived item') as product_name
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [s.id],
    );
    result.push({ ...s, items });
  }

  return result;
}

export async function fetchCategories(): Promise<{ id: string; name: string }[]> {
  const db = getDatabase();
  return await db.getAllAsync<{ id: string; name: string }>(
    'SELECT id, name FROM product_categories ORDER BY name ASC',
  );
}

export async function saveCategory(name: string): Promise<string> {
  const db = getDatabase();
  const id = `cat_${Date.now()}`;
  await db.runAsync('INSERT INTO product_categories (id, vendor_id, name) VALUES (?, ?, ?)', [
    id,
    DEFAULT_VENDOR_ID,
    name,
  ]);
  return id;
}

export async function fetchExpenses(): Promise<Expense[]> {
  const db = getDatabase();
  return await db.getAllAsync<Expense>('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 50');
}

export async function saveExpense(
  category: string,
  amount: number,
  note?: string,
): Promise<string> {
  const db = getDatabase();
  const id = `exp_${Date.now()}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO expenses (id, vendor_id, category, amount, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, DEFAULT_VENDOR_ID, category, amount, note ?? null, now],
  );
  return id;
}

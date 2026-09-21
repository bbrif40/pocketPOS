/**
 * PocketPOS — Local SQLite schema
 * Creates all tables needed by Phases 0–2 (offline-first local storage).
 * Schema mirrors 02_SPEC.md §4.
 */

export const CREATE_TABLES_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  -- ─────────────────────────────────────────────
  -- Vendor (single row for the local device owner)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS vendors (
    id               TEXT PRIMARY KEY,
    business_name    TEXT NOT NULL,
    owner_user_id    TEXT NOT NULL,
    plan             TEXT NOT NULL DEFAULT 'free',
    plan_expires_at  TEXT,
    created_at       TEXT NOT NULL
  );

  -- ─────────────────────────────────────────────
  -- Users
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    vendor_id     TEXT,
    phone         TEXT,
    email         TEXT,
    password_hash TEXT,
    role          TEXT NOT NULL DEFAULT 'owner',
    branch_id     TEXT,
    created_at    TEXT NOT NULL
  );

  -- ─────────────────────────────────────────────
  -- Branches (Business plan)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS branches (
    id         TEXT PRIMARY KEY,
    vendor_id  TEXT NOT NULL,
    name       TEXT NOT NULL,
    address    TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );

  -- ─────────────────────────────────────────────
  -- Product categories (Pro+)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS product_categories (
    id        TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    name      TEXT NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );

  -- ─────────────────────────────────────────────
  -- Products
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS products (
    id                TEXT PRIMARY KEY,
    vendor_id         TEXT NOT NULL,
    branch_id         TEXT,
    name              TEXT NOT NULL,
    price             REAL NOT NULL,
    cost_price        REAL,
    category_id       TEXT,
    stock_qty         INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 5,
    created_at        TEXT NOT NULL,
    archived_at       TEXT,
    FOREIGN KEY (vendor_id)   REFERENCES vendors(id),
    FOREIGN KEY (branch_id)   REFERENCES branches(id),
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
  );

  -- ─────────────────────────────────────────────
  -- Sales
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS sales (
    id             TEXT PRIMARY KEY,
    vendor_id      TEXT NOT NULL,
    branch_id      TEXT,
    user_id        TEXT NOT NULL,
    total_amount   REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    created_at     TEXT NOT NULL,
    synced_at      TEXT,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (user_id)   REFERENCES users(id)
  );

  -- ─────────────────────────────────────────────
  -- Sale items
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS sale_items (
    id         TEXT PRIMARY KEY,
    sale_id    TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity   INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    line_total REAL NOT NULL,
    FOREIGN KEY (sale_id)    REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  -- ─────────────────────────────────────────────
  -- Stock adjustments
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS stock_adjustments (
    id                  TEXT PRIMARY KEY,
    product_id          TEXT NOT NULL,
    delta_qty           INTEGER NOT NULL,
    reason              TEXT NOT NULL DEFAULT 'manual',
    created_at          TEXT NOT NULL,
    created_by_user_id  TEXT NOT NULL,
    FOREIGN KEY (product_id)         REFERENCES products(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
  );

  -- ─────────────────────────────────────────────
  -- Expenses (Pro+)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS expenses (
    id         TEXT PRIMARY KEY,
    vendor_id  TEXT NOT NULL,
    branch_id  TEXT,
    category   TEXT NOT NULL,
    amount     REAL NOT NULL,
    note       TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  -- ─────────────────────────────────────────────
  -- Subscriptions (local copy; updated on sync)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS subscriptions (
    id                    TEXT PRIMARY KEY,
    vendor_id             TEXT NOT NULL,
    plan                  TEXT NOT NULL,
    status                TEXT NOT NULL DEFAULT 'active',
    started_at            TEXT NOT NULL,
    renews_at             TEXT,
    payment_provider_ref  TEXT,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );

  -- ─────────────────────────────────────────────
  -- Exports metadata (Pro+)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS exports (
    id           TEXT PRIMARY KEY,
    vendor_id    TEXT NOT NULL,
    type         TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end   TEXT NOT NULL,
    file_url     TEXT,
    checksum     TEXT,
    generated_at TEXT NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );

  -- ─────────────────────────────────────────────
  -- Sync outbox (Phase 4+: queued mutations for server)
  -- ─────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS sync_outbox (
    id          TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id   TEXT NOT NULL,
    payload     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    attempts    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL
  );
`;

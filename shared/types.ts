/**
 * PocketPOS — Shared TypeScript types
 * Reflects the data model from 02_SPEC.md §4.
 * These types are used by both the mobile app (Phase 0+) and
 * the backend (Phase 3+) so neither side duplicates definitions.
 */

// ─────────────────────────────────────────────
// Enums / Union types
// ─────────────────────────────────────────────

export type Plan = 'free' | 'basic' | 'pro' | 'business';

export type UserRole = 'owner' | 'staff';

export type PaymentMethod = 'cash' | 'gcash' | 'other';

export type StockAdjustmentReason = 'manual' | 'sale' | 'restock' | 'correction';

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled';

export type ExportType = 'pdf' | 'csv' | 'loan_report';

export type SyncOutboxStatus = 'pending' | 'synced' | 'failed';

// ─────────────────────────────────────────────
// Core entities
// ─────────────────────────────────────────────

export interface Vendor {
  id: string;
  business_name: string;
  owner_user_id: string;
  plan: Plan;
  plan_expires_at: string | null; // ISO timestamp
  created_at: string;
}

export interface User {
  id: string;
  vendor_id: string | null;
  phone: string | null;
  email: string | null;
  password_hash: string | null;
  role: UserRole;
  branch_id: string | null;
  created_at: string;
}

/** Business plan only */
export interface Branch {
  id: string;
  vendor_id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  vendor_id: string;
  name: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  branch_id: string | null;
  name: string;
  price: number; // in PHP, stored as decimal
  cost_price: number | null; // used for profit calc (Basic+)
  category_id: string | null; // Pro+
  stock_qty: number;
  reorder_threshold: number;
  created_at: string;
  archived_at: string | null;
}

export interface Sale {
  id: string;
  vendor_id: string;
  branch_id: string | null;
  user_id: string;
  total_amount: number;
  payment_method: PaymentMethod; // Pro+ tracking; defaults to 'cash'
  created_at: string;
  synced_at: string | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface StockAdjustment {
  id: string;
  product_id: string;
  delta_qty: number; // positive = add, negative = subtract
  reason: StockAdjustmentReason;
  created_at: string;
  created_by_user_id: string;
}

/** Pro+ only */
export interface Expense {
  id: string;
  vendor_id: string;
  branch_id: string | null;
  category: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  vendor_id: string;
  plan: Plan;
  status: SubscriptionStatus;
  started_at: string;
  renews_at: string | null;
  payment_provider_ref: string | null;
}

/** Pro+ — generated exports (PDF/CSV) */
export interface Export {
  id: string;
  vendor_id: string;
  type: ExportType;
  period_start: string;
  period_end: string;
  file_url: string | null;
  checksum: string | null;
  generated_at: string;
}

/** Mobile-only — local sync queue */
export interface SyncOutboxEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  payload: string; // JSON string
  status: SyncOutboxStatus;
  attempts: number;
  created_at: string;
}

// ─────────────────────────────────────────────
// Entitlement types (used by both client & server)
// ─────────────────────────────────────────────

export interface Entitlements {
  plan: Plan;
  maxProducts: number | null; // null = unlimited
  maxDevices: number;
  autoStockDeduction: boolean;
  autoProfitCalc: boolean;
  cloudBackupSync: boolean;
  bluetoothPrinting: boolean;
  analytics: boolean;
  expenseTracking: boolean;
  exportPdfCsv: boolean;
  financialHealthScore: boolean;
  multiBranch: boolean;
  multiUser: boolean;
  loanReadinessReport: boolean;
  dataRetentionDays: number | null; // null = unlimited
}

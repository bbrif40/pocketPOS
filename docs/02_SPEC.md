# PocketPOS — Functional & Data Spec

## 1. Users & Roles
- **Owner** — the vendor who signs up; full access to their account/branches.
- **Staff** (Business plan only) — invited by Owner, role-based permissions
  (e.g. can record sales, cannot delete records or view consolidated reports).

## 2. Feature List by Tier (source of truth — from product brief)

### Free Plan
- Manual Sales Entry (item, quantity, price)
- Daily Sales Summary (total sales + transaction count)
- Basic Stock List (manual add/subtract, no auto-deduction)
- Product limit: 20
- Single device, single user
- Transaction history: 30 days retention

### Basic Plan (₱149/mo) — includes all Free, plus:
- Automatic Profit Computation (per sale, per day)
- Auto Stock Deduction on sale
- Low-Stock Alerts (configurable reorder threshold)
- Unlimited products
- Sales History & Reports (daily/weekly)
- Bluetooth Receipt Printing (optional)
- Cloud Backup

### Pro Plan (₱299/mo) — includes all Basic, plus:
- Sales Analytics (best-sellers, slow movers, peak hours/days)
- Monthly/Quarterly Reports (income & expense summaries)
- Exportable Records (PDF/CSV — proof of income for microloans)
- Payment Method Tracking (cash, GCash, other)
- Expense Tracking (full profit/loss view)
- Custom Product Categories
- Smart Restock Reminders (based on sales velocity)

### Business Plan (₱599/mo) — includes all Pro, plus:
- Multi-User Access (owner + staff, role-based permissions)
- Multi-Branch Management
- Consolidated Reporting across branches
- Priority Support
- Loan-Readiness Report (formatted for bank/microlender submission)
- Supplier/Purchase Order Tracking
- Advanced Dashboard (6–12 month trend analysis)

### Cross-tier / Additional Features
- Built-in Cash & Change Calculator (all tiers)
- Transaction Editing & Correction (all tiers, permission-gated)
- Financial Health Score (Pro/Business) — composite of sales consistency,
  profit margin, inventory turnover, cash flow, expense ratio
- Automatic Cloud Sync (Basic+)
- Offline Mode (all tiers — core architectural requirement, not a paid add-on)

## 3. Non-Functional Requirements
- **Offline-capable**: recording a sale, adjusting stock, and viewing today's
  summary must work with zero connectivity.
- **Low friction onboarding**: usable within ~2 minutes of install, no
  accounting knowledge required.
- **Performance**: sale entry flow (search/select product → confirm) under
  3 taps for a repeat item.
- **Data retention**: Free = 30 days local history; paid tiers = unlimited,
  backed by cloud.
- **Localization**: Filipino/English UI toggle (stretch goal, not MVP-blocking).
- **Accessibility**: large tap targets, high-contrast mode (target users may
  use budget phones outdoors in bright sunlight).

## 4. Core Data Model

```
vendors
  id, business_name, owner_user_id, plan, plan_expires_at, created_at

users
  id, vendor_id (nullable if staff), phone, email, password_hash,
  role (owner|staff), branch_id (nullable), created_at

branches                          -- Business plan
  id, vendor_id, name, address, created_at

products
  id, vendor_id, branch_id (nullable), name, price, cost_price (nullable),
  category_id (nullable, Pro+), stock_qty, reorder_threshold, created_at,
  archived_at

product_categories                -- Pro+
  id, vendor_id, name

sales
  id, vendor_id, branch_id, user_id (who recorded it), total_amount,
  payment_method (cash|gcash|other, Pro+), created_at, synced_at

sale_items
  id, sale_id, product_id, quantity, unit_price, line_total

stock_adjustments
  id, product_id, delta_qty, reason (manual|sale|restock|correction),
  created_at, created_by_user_id

expenses                          -- Pro+
  id, vendor_id, branch_id, category, amount, note, created_at

subscriptions
  id, vendor_id, plan, status (active|past_due|cancelled), started_at,
  renews_at, payment_provider_ref

exports
  id, vendor_id, type (pdf|csv|loan_report), period_start, period_end,
  file_url, checksum, generated_at

sync_outbox (local/mobile only, mirrors pending pushes)
  id, entity_type, entity_id, payload, status, attempts, created_at
```

## 5. API Surface (REST, versioned `/api/v1`)

**Auth**
- `POST /auth/register` — phone/email + password or OTP request
- `POST /auth/verify-otp`
- `POST /auth/login`
- `POST /auth/refresh`

**Vendor/Account**
- `GET /vendors/me`
- `PATCH /vendors/me`

**Products**
- `GET /products`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id` (soft delete/archive)

**Sales**
- `POST /sales` (batched sync-friendly: accepts array of offline-queued sales)
- `GET /sales?from=&to=&branch_id=`
- `GET /sales/summary/daily`
- `GET /sales/summary/weekly` (Basic+)
- `GET /sales/analytics` (Pro+: best-sellers, peak hours)

**Stock**
- `POST /stock/adjustments`
- `GET /stock/low-stock`

**Expenses** (Pro+)
- `POST /expenses`
- `GET /expenses`

**Reports/Exports** (Pro+ for exports; Business for loan-readiness report)
- `GET /reports/monthly`
- `GET /reports/quarterly`
- `POST /exports` (generates PDF/CSV, returns signed URL)
- `POST /reports/loan-readiness` (Business)

**Users/Staff** (Business)
- `POST /staff/invite`
- `GET /staff`
- `PATCH /staff/:id/role`
- `DELETE /staff/:id`

**Branches** (Business)
- `GET /branches`
- `POST /branches`
- `GET /branches/:id/report`

**Billing**
- `GET /billing/plans`
- `POST /billing/subscribe`
- `POST /billing/webhook` (payment provider callback)

## 6. Entitlement Matrix (used by client + server gating)

| Capability | Free | Basic | Pro | Business |
|---|---|---|---|---|
| Product limit | 20 | ∞ | ∞ | ∞ |
| Devices/users | 1 | 1 | 1 | multi |
| Auto stock deduction | ✗ | ✓ | ✓ | ✓ |
| Auto profit calc | ✗ | ✓ | ✓ | ✓ |
| Cloud backup/sync | ✗ | ✓ | ✓ | ✓ |
| Bluetooth printing | ✗ | ✓ | ✓ | ✓ |
| Analytics | ✗ | ✗ | ✓ | ✓ |
| Expense tracking | ✗ | ✗ | ✓ | ✓ |
| Export PDF/CSV | ✗ | ✗ | ✓ | ✓ |
| Financial Health Score | ✗ | ✗ | ✓ | ✓ |
| Multi-branch | ✗ | ✗ | ✗ | ✓ |
| Multi-user/staff roles | ✗ | ✗ | ✗ | ✓ |
| Loan-readiness report | ✗ | ✗ | ✗ | ✓ |

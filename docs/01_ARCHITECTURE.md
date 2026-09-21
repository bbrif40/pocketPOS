# PocketPOS — System Architecture

## 1. Product Summary
PocketPOS is a mobile-first point-of-sale and bookkeeping app for micro-vendors
(street food stalls, market carts, sari-sari stores). It must work with little
to no training, work offline by default, and turn ordinary sales activity into
exportable, loan-ready financial records. Tiers: **Free, Basic (₱149/mo), Pro
(₱299/mo), Business (₱599/mo)**.

Architectural priorities, in order:
1. **Works offline, syncs when online** — vendors often have spotty connectivity.
2. **Dead simple UI** — no accounting jargon, big buttons, minimal typing.
3. **Cheap to run** — target users are extremely price-sensitive; infra cost per
   vendor must stay low.
4. **Tier-gated features** — the same codebase serves Free through Business;
   feature access is a config/entitlement check, not separate builds.
5. **Trustworthy records** — exports must be tamper-evident enough to be usable
   as proof of income.

## 2. Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile app | **React Native + Expo (TypeScript)** | Single codebase for Android/iOS; Android-first since target users are Android/budget-phone heavy; Expo simplifies OTA updates and Bluetooth/printer plugins. |
| Local storage | **SQLite (expo-sqlite / WatermelonDB)** | App must be usable with zero connectivity; SQLite is the source of truth on-device. |
| Sync layer | **Custom REST sync + queued mutations** | Simple, debuggable "outbox" pattern beats a full realtime sync engine for this use case. |
| Backend API | **Node.js + Express (or Fastify) + TypeScript** | Matches frontend language, easy to hire for, huge ecosystem. |
| Backend DB | **PostgreSQL** (hosted, e.g. Supabase/Neon/RDS) | Relational integrity for sales/stock/ledger data; good reporting support. |
| Auth | **JWT-based auth (email/phone + OTP or password)**, via own service or Supabase Auth | Vendors may not have email; phone+OTP is likely primary. |
| File/Export storage | **S3-compatible object storage** | For generated PDF/CSV exports and cloud backups. |
| Push notifications | **Firebase Cloud Messaging** | For low-stock alerts, restock reminders. |
| Payments/subscriptions | **GCash/PayMongo/Xendit integration** | Local PH payment rails for plan billing. |
| Printing | **Bluetooth ESC/POS via react-native-thermal-receipt-printer or similar** | Optional receipt printing (Basic+). |

> Decision point for the AI assistant: if the team wants to move faster with
> less backend code, **Supabase** (Postgres + Auth + Storage + Realtime) can
> replace the custom Node backend for MVP. The spec below is written so either
> choice works — endpoints in `02_SPEC.md` map cleanly to Supabase RPC/REST or
> a custom Express API.

## 3. High-Level Diagram

```
┌─────────────────────────────┐
│        Mobile App (RN)      │
│  ┌────────────┐ ┌─────────┐ │
│  │ UI Screens │ │  Local  │ │
│  │ (Sales,    │ │ SQLite  │ │
│  │ Stock,     │ │ (source │ │
│  │ Reports)   │ │ of truth│ │
│  └─────┬──────┘ └────┬────┘ │
│        │  Sync Queue  │     │
│        └──────┬───────┘     │
└───────────────┼─────────────┘
                 │ HTTPS (when online)
                 ▼
┌─────────────────────────────┐
│        Backend API          │
│  Auth │ Sales │ Stock │      │
│  Reports │ Billing │ Users   │
└───────────────┬─────────────┘
                 ▼
     ┌───────────────────────┐
     │  PostgreSQL (primary)  │
     └───────────────────────┘
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
Object Storage         Push Notifications
(exports, backups)     (FCM)
```

## 4. Offline-First Sync Model
- Every local write (sale, stock adjustment, expense entry) is written to
  SQLite **and** appended to an `outbox` table with a status (`pending`,
  `synced`, `failed`).
- A background sync worker runs on app foreground/network-reconnect: pushes
  pending outbox rows to the API in order, marks them synced, pulls down any
  server-side changes (e.g. from another staff device on Business plan).
- Conflict rule: **server is source of truth for anything already synced**;
  local-only records always win until synced (vendor is the only writer on
  Free/Basic/Pro — conflicts mainly matter once Multi-User/Multi-Branch
  (Business) is enabled).
- All monetary calculations (profit, totals) are computed **locally first**
  from local data so the app is fully usable offline; the backend recomputes
  and is the reconciled source for reports/exports.

## 5. Core Data Model (see `02_SPEC.md` §4 for full schema)
Core entities: `vendors`, `users` (owner/staff), `branches`, `products`,
`sales`, `sale_items`, `stock_adjustments`, `expenses`, `subscriptions`,
`payment_methods`, `exports`.

## 6. Feature Gating Architecture
- A single `entitlements` module resolves `plan -> feature flags` (e.g.
  `{ maxProducts: 20, autoStockDeduction: false, analytics: false, ... }`).
- Every screen/action checks entitlements **client-side** (for instant UX,
  e.g. graying out a feature with an "Upgrade" badge) **and server-side**
  (source of truth, since client can be tampered with).
- Plan changes take effect by refreshing the entitlements object after
  purchase webhook confirms payment.

## 7. Security & Data Integrity
- All API traffic over HTTPS/TLS.
- JWT access + refresh tokens; refresh rotated on use.
- Role-based access control for Multi-User (Business plan): `owner`, `staff`
  (staff scoped to their branch, limited permissions e.g. no delete/export).
- Exported financial records (PDF/CSV) include a checksum/hash + timestamp so
  a lender can verify the export hasn't been edited after generation.
- Backups encrypted at rest in object storage.

## 8. Deployment
- Backend: containerized (Docker), deployed to a low-cost host (Render,
  Fly.io, or a small VPS) to keep infra costs down.
- Mobile: Expo EAS Build for Android (primary) and iOS (secondary) release
  channels; OTA updates via Expo Updates for non-native-code changes.
- CI: GitHub Actions — lint/test on PR, build on merge to `main`.

## 9. Non-Goals for v1
- No multi-currency support (PHP only).
- No real-time collaborative editing beyond simple sync-on-reconnect.
- No native inventory barcode scanning in MVP (candidate for later phase).

# PocketPOS — Build Tasks for AI Coding Assistant

**Build order: frontend first, backend second.** The offline-first
architecture makes this natural — nearly the entire app can be built and used
against local SQLite before a backend exists at all. Backend work starts at
Phase 3, once the UI and local data model are proven out.

Work phase by phase, in order. Do not start a phase until the previous one's
acceptance criteria pass. Each task should end with working, tested code —
avoid large unreviewed batches of changes.

## Phase 0 — Frontend Project Setup (no backend yet)
- [ ] Init the mobile app: Expo + React Native + TypeScript, in its own
      `/mobile` folder (keep it standalone for now — no monorepo tooling
      needed until Phase 3 introduces a backend).
- [ ] Set up ESLint + Prettier + TypeScript strict mode.
- [ ] Set up navigation (React Navigation): tab structure for Home/Sell,
      Products, Reports, Settings.
- [ ] Set up local SQLite (expo-sqlite or WatermelonDB) with the schema from
      `02_SPEC.md` §4 (products, sales, sale_items, stock_adjustments,
      expenses, product_categories) — the local DB is the only data store
      through Phase 2.
- [ ] Set up a `/shared` folder (or just a `types.ts`) for the TypeScript
      types describing these entities, so the backend can reuse them later.
- **Acceptance:** Expo app runs on simulator/device with tab navigation and
  an empty local database ready to read/write.

## Phase 1 — Core Sell Loop (Free tier UI)
- [ ] Build Home/Sell screen: product grid, quantity stepper, running total,
      Cash & Change Calculator, Confirm Sale — writes directly to local
      SQLite.
- [ ] Build Product management: add/edit/archive product, enforce the
      20-product cap on Free, manual stock add/subtract.
- [ ] Build Today Summary screen (total sales, transaction count) from local
      SQLite queries.
- [ ] Build Transaction History (30-day rolling view).
- [ ] Build the **entitlements module** now, even though there's no backend
      or billing yet: read plan flags from `02_SPEC.md` §6, driven for now by
      a local dev/debug "plan switcher" in Settings so every later screen can
      be built and tested against any tier without waiting for real billing.
- **Acceptance:** A vendor can add products, record sales, adjust stock, and
  view today's totals, entirely offline, no account or backend involved.

## Phase 2 — Full UI Build-Out (Basic/Pro/Business screens, still local-only)
Build every remaining screen from `03_WALKTHROUGH.md`, using local SQLite
and, where a screen would normally need server-computed data (analytics,
exports, consolidated multi-branch reports), use realistic **local/mocked
computations** for now so the UI is fully clickable and demoable before the
backend exists. Flag every mock clearly with a `// TODO(backend):` comment.

- [ ] Automatic Profit Computation + Auto Stock Deduction on sale (local
      calculation, using a `cost_price` field on product).
- [ ] Low-Stock Alerts (local notification when qty ≤ threshold).
- [ ] Sales History & Reports (daily/weekly), computed from local SQLite.
- [ ] Bluetooth receipt printing integration (this one's genuinely
      device-local, not mocked — wire it for real).
- [ ] Expense tracking screen + full profit/loss view (local).
- [ ] Custom product categories (local CRUD).
- [ ] Sales Analytics screen (best-sellers, slow movers, peak hours) —
      computed from local data; note in code this must later be replaced by
      server-side aggregation for correctness at scale.
- [ ] Smart Restock Reminders (local velocity calc).
- [ ] Financial Health Score screen (local calc + plain-language
      explanation).
- [ ] Export screen UI (PDF/CSV) — generate a locally-rendered PDF for now
      (e.g. via a local HTML-to-PDF lib) as a stand-in; real version will call
      a backend endpoint in Phase 4.
- [ ] Upgrade/plan comparison screen mirroring the entitlement matrix
      (checkout itself is stubbed/fake until Phase 5 billing integration).
- [ ] Multi-branch and staff/role UI shells (Business tier) — screens exist
      and are navigable, backed by local mock data; real multi-user behavior
      requires a backend and comes in Phase 5.
- [ ] Loan-Readiness Report screen (mocked data, real layout).
- **Acceptance:** Every screen in `03_WALKTHROUGH.md` is built and navigable
  using the dev plan switcher to preview each tier; app is fully demoable
  end-to-end with local data, with `TODO(backend)` markers everywhere real
  server logic will eventually replace a mock.

## Phase 3 — Backend Foundation
- [ ] Turn the project into a proper monorepo: add `/backend` (Node/Express
      or Fastify, TypeScript) alongside `/mobile`, share types via
      `/shared`.
- [ ] Set up PostgreSQL (docker-compose) + migration tool (Prisma or
      Drizzle) using the schema in `02_SPEC.md` §4.
- [ ] Scaffold CI (GitHub Actions): lint + typecheck + test for both
      `/mobile` and `/backend`.
- [ ] Implement `auth` endpoints (phone+OTP or email+password), JWT
      issuance/refresh.
- [ ] Implement `vendors`, `products`, `sales`, `stock_adjustments`,
      `expenses` tables + CRUD endpoints per `02_SPEC.md` §5.
- **Acceptance:** Backend runs locally with a real Postgres DB; Postman/curl
  can register a user, log in, and CRUD products and sales against it. Mobile
  app is not yet connected.

## Phase 4 — Connect Frontend to Backend (replace mocks with real sync)
- [ ] Mobile: build the sync outbox — queue local writes, push on
      reconnect/foreground, mark synced, retry/backoff on failure.
- [ ] Mobile: add account creation/login flow; app remains usable in
      guest/local-only mode until the vendor chooses to sync (don't force
      login).
- [ ] Replace the local dev "plan switcher" with real entitlements driven by
      the backend's `subscriptions` data (dev switcher can stay as a
      developer-only debug toggle, but production reads real plan state).
- [ ] Wire Cloud Backup: successful sync backs up data; add a restore flow on
      new device login.
- [ ] Replace mocked Sales History/Reports with real API-backed queries.
- **Acceptance:** Vendor can create an account, and data recorded offline
  correctly syncs once back online (verified with an airplane-mode test);
  logging in on a second device restores their data.

## Phase 5 — Replace Remaining Mocks with Real Backend Logic
- [ ] Backend: real sales analytics endpoint (SQL aggregation: best-sellers,
      slow movers, peak hours/days) — swap into the Phase 2 analytics screen.
- [ ] Backend: monthly/quarterly report generation; export generation (PDF
      via Puppeteer/PDFKit, CSV serialization), signed URL delivery, checksum
      stored in `exports` table — swap into the Phase 2 export screen.
- [ ] Backend: real Financial Health Score computation, replacing the local
      mock.
- [ ] Backend: `branches` table + endpoints, RBAC (`owner`/`staff`), staff
      invite flow — wire into the Phase 2 multi-branch/staff UI shells.
- [ ] Backend: Consolidated Reporting across branches; Loan-Readiness Report
      generation (real data + verification checksum).
- [ ] Backend: Supplier/Purchase Order CRUD, wired into whatever UI shell
      Phase 2 built for it.
- [ ] Backend: real billing — `/billing/plans`, `/billing/subscribe`,
      GCash/PayMongo sandbox webhook, updating `subscriptions` +
      entitlements on confirmed payment; replace the stubbed checkout from
      Phase 2.
- **Acceptance:** No `TODO(backend)` mocks remain. Every screen from
  `03_WALKTHROUGH.md` is backed by real server logic, and a full upgrade
  flow (Free → Basic → Pro → Business) works via sandbox payments.

## Phase 6 — Polish & Hardening
- [ ] Accessibility pass: tap target sizes, high-contrast mode, font scaling.
- [ ] Localization scaffolding (English/Filipino string tables).
- [ ] Load-test sync endpoints for burst traffic (market opening hours).
- [ ] Security review: rotate JWT secrets, rate-limit auth endpoints, audit
      RBAC boundary cases (staff trying to hit owner-only endpoints directly).
- [ ] Full offline QA pass across every screen (per `03_WALKTHROUGH.md` #8).
- [ ] App store / Play Store listing assets and submission.
- **Acceptance:** App passes a manual QA pass against every walkthrough in
  `03_WALKTHROUGH.md`, and store submissions are accepted.

## Cross-Cutting, Ongoing Throughout All Phases
- [ ] Write unit tests for all profit/stock/analytics calculation logic —
      local versions in Phase 1–2, and again for the backend versions in
      Phase 3–5 — since vendors are trusting this app with their money.
- [ ] Write integration tests for sync once it exists (offline write →
      reconnect → server state matches local state).
- [ ] Keep `02_SPEC.md`'s entitlement matrix and actual code in sync — treat
      it as the single source of truth for gating logic, in both the Phase 1
      dev switcher and the Phase 4+ real entitlements.

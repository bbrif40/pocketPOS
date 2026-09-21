# PocketPOS — Key User Walkthroughs

These flows describe the intended UX end-to-end. Use them to drive screen
design and to write acceptance criteria for tasks in `04_TASKS.md`.

## Walkthrough 1 — First-Time Onboarding (Free Plan)
1. Vendor installs app, opens it → sees a single "Get Started" screen (no
   marketing fluff).
2. Enters phone number → OTP verification (or skips auth entirely for a fully
   local "guest mode" that prompts to create an account only when they hit a
   limit, to reduce onboarding friction).
3. Quick 3-question setup: business name, business type (food stall / sari-sari
   / cart / other), currency confirmed as ₱.
4. Prompted to add their first product (name + price) — big "+" button, no
   required fields beyond name and price.
5. Lands on the **Home / Sell screen** — this is the default screen every time
   the app opens.

## Walkthrough 2 — Recording a Sale (core loop, all tiers)
1. Home screen shows a grid of the vendor's products (most-sold first).
2. Vendor taps a product → quantity stepper appears (defaults to 1).
3. Vendor taps "Add" (repeatable for multiple items) → running total shown at
   bottom.
4. Vendor taps "Charge" → Cash & Change Calculator appears: vendor enters cash
   received, app shows change due.
5. (Basic+) Payment method selector (cash/GCash/other) appears before charge
   confirmation.
6. Vendor confirms → sale is saved **instantly to local SQLite** (works
   offline), stock is auto-deducted (Basic+) or vendor manually adjusts later
   (Free), running daily total updates.
7. Optional: "Print Receipt" (Basic+, if printer paired).
8. Sale silently queues for cloud sync; syncs next time online.

**Target: entire flow ≤ 3 taps for a single repeat-item sale.**

## Walkthrough 3 — Checking Today's Numbers (Free+)
1. From Home, vendor taps "Today" tab.
2. Sees: total sales, transaction count, (Basic+) computed profit.
3. Free tier sees only the raw total; Basic+ sees profit breakdown because
   cost_price is used in computation.

## Walkthrough 4 — Stock Management
- **Free**: vendor manually taps a product → "Adjust Stock" → +/- quantity,
  with a reason note (optional).
- **Basic+**: stock auto-decrements on each sale; manual adjustment still
  available for restocks/spoilage/corrections. Low-stock badge appears on
  product tile when qty ≤ reorder_threshold.
- **Pro+**: "Smart Restock" tab shows products trending toward stock-out based
  on recent sales velocity, not just the fixed threshold.

## Walkthrough 5 — Upgrading a Plan
1. Vendor hits a gated feature (e.g. tries to add a 21st product on Free, or
   taps a greyed-out "Analytics" tab).
2. A contextual upsell sheet explains *specifically* what unlocks (not a
   generic paywall) — e.g. "Basic unlocks unlimited products + auto profit
   tracking — ₱149/mo."
3. Vendor taps "Upgrade" → plan comparison screen (mirrors the entitlement
   matrix in `02_SPEC.md`) → selects plan → GCash/PayMongo checkout.
4. On payment webhook confirmation, `subscriptions` row updates, client
   refetches entitlements, gated UI unlocks without requiring app restart.

## Walkthrough 6 — Generating a Loan-Ready Export (Pro/Business)
1. Vendor goes to Reports → Export.
2. Picks a period (month/quarter) and format (PDF for lenders, CSV for
   personal use).
3. (Business) Option to generate the formatted "Loan-Readiness Report"
   instead of a raw export — includes vendor identity, business summary,
   income trend chart, and a verification checksum.
4. App calls `/exports`, backend compiles data server-side (source of truth,
   not just local cache) and returns a signed download URL.
5. Vendor can share directly (email/GCash/Viber/etc.) via native share sheet.

## Walkthrough 7 — Multi-Branch / Staff (Business)
1. Owner adds a branch under Settings → Branches.
2. Owner invites staff by phone number, assigns role + branch.
3. Staff logs in on their own device, sees only their branch's Sell screen and
   Today summary — no access to consolidated reports, exports, or settings.
4. Owner's "Consolidated" dashboard aggregates all branches; can drill into a
   single branch's numbers.

## Walkthrough 8 — Working Fully Offline
1. Vendor has no signal all day at the market.
2. Every sale, stock adjustment, and expense entry works exactly as online —
   all writes hit local SQLite immediately, UI never blocks on network.
3. A small persistent indicator shows "X items pending sync."
4. When the phone reconnects (e.g. back home on wifi), sync runs
   automatically in the background; indicator clears once all items sync.
5. If a sync conflict is ever possible (Business multi-user case), server
   response reconciles and app silently updates local state — vendor is never
   shown a manual conflict-resolution UI in v1 (last-write-wins is acceptable
   in this case).

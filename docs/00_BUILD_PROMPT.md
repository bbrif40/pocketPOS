You are building **PocketPOS**, a mobile-first point-of-sale and bookkeeping
app for Philippine micro-vendors (street food stalls, market carts, sari-sari
stores). I've attached four reference docs — read all of them before writing
any code:

- `01_ARCHITECTURE.md` — tech stack, system design, offline-sync model, data
  model overview, security notes.
- `02_SPEC.md` — full feature list by pricing tier (Free/Basic/Pro/Business),
  non-functional requirements, complete data schema, API surface, and the
  entitlement matrix that gates features by plan.
- `03_WALKTHROUGH.md` — the exact user flows the app must support, written as
  step-by-step walkthroughs (onboarding, recording a sale, upgrading,
  exporting loan-ready reports, offline behavior, etc).
- `04_TASKS.md` — the phased build plan (Phase 0 through Phase 6) with
  checklist tasks and acceptance criteria for each phase.

**Build order: frontend first, backend second.** Specifically:
- Phases 0–2 build the entire mobile app (Expo/React Native/TypeScript)
  against **local SQLite only** — no backend, no auth, no real payments.
  Anything that would normally need a server (analytics, exports,
  multi-branch data) gets a clearly-marked local mock so the UI is fully
  built and demoable on its own.
- Phase 3 introduces the backend (Node/TypeScript + PostgreSQL) as a
  standalone piece, tested independently of the app.
- Phases 4–5 connect the two: real sync, real auth, real billing, and real
  server-computed data replacing the Phase 2 mocks one at a time.
- Phase 6 is cross-cutting polish.

**Your job right now: start at Phase 0 in `04_TASKS.md` and work forward
phase by phase. Do not skip ahead to later-phase features, and do not start
backend work before Phase 3.**

Ground rules:
1. Stack: React Native (Expo, TypeScript) for mobile now; Node.js/TypeScript
   + PostgreSQL for the backend later; SQLite on-device for offline-first
   local storage throughout. Follow `01_ARCHITECTURE.md` unless you have a
   strong, clearly-stated reason to deviate — if you do deviate, tell me why
   before proceeding.
2. Offline-first is non-negotiable: every core action (recording a sale,
   adjusting stock) must work with zero network connectivity, per
   `03_WALKTHROUGH.md` walkthrough 8 — this should be natural to satisfy
   since the whole frontend phase is built local-only anyway.
3. Feature access must be driven by the entitlement matrix in `02_SPEC.md`
   §6, not hardcoded per-screen checks — build the entitlements module in
   Phase 1 (using a local dev plan-switcher, since there's no real billing
   yet) so every later screen just checks a flag.
4. Mark every backend-dependent mock built during Phases 1–2 with a
   `// TODO(backend): ...` comment describing exactly what it should become,
   so Phase 5 is a clean mock-removal pass, not a rewrite.
5. Don't invent scope beyond what's in these docs. If something's genuinely
   ambiguous, ask me a specific question rather than guessing silently.
6. After finishing each phase, stop and summarize: what was built, how to run
   it/test it, and which acceptance criteria from `04_TASKS.md` pass. Wait
   for my go-ahead before starting the next phase.
7. Write tests for anything involving money math (profit computation, stock
   deduction, analytics aggregation) from Phase 1 onward, even while it's
   still local-only — vendors are trusting this app with their income
   records.

Start now with **Phase 0 — Frontend Project Setup**. Set up the Expo/React
Native/TypeScript app, navigation, and local SQLite schema, then stop and
report back.

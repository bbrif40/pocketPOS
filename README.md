# PocketPOS

A mobile-first point-of-sale (POS) and bookkeeping application designed specifically for Philippine micro-vendors (street food stalls, market carts, sari-sari stores).

## 🚀 Overview

PocketPOS empowers small vendors with an offline-first POS experience that handles transactions seamlessly, tracks inventory and expenses, computes daily and weekly profitability, and generates loan-readiness reports.

- **Offline-First**: Core operations (sales, inventory adjustments, local reports) function completely offline without internet connectivity.
- **Micro-Vendor Optimized**: Tailored UX for fast cashier operations, cash and e-wallet (GCash / Maya) tracking.
- **Tiered Entitlement Architecture**: Feature access is managed cleanly across Free, Basic, Pro, and Business tiers.

## 📁 Repository Structure

- `mobile/`: React Native / Expo application built with TypeScript, Expo SQLite, and React Navigation.
- `shared/`: Shared domain types and business logic schemas across client and backend services.
- `docs/`: System documentation, architecture diagrams, product specifications, user walkthroughs, and development roadmap.

## 🛠 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app or Android/iOS Emulator

### Mobile Setup
```bash
cd mobile
npm install
npm run start
```

Press `a` to run on Android emulator, `i` for iOS simulator, or scan the QR code with the Expo Go app.

## 📖 Documentation
- [00_BUILD_PROMPT.md](docs/00_BUILD_PROMPT.md) - Project scope and build guidelines
- [01_ARCHITECTURE.md](docs/01_ARCHITECTURE.md) - Technical stack and offline sync design
- [02_SPEC.md](docs/02_SPEC.md) - Feature specifications and data models
- [03_WALKTHROUGH.md](docs/03_WALKTHROUGH.md) - Step-by-step user journey guides
- [04_TASKS.md](docs/04_TASKS.md) - Implementation phases and milestones

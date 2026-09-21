/**
 * PocketPOS — Navigation type definitions
 * Typed params for every route so navigation.navigate() is type-safe.
 */

export type RootTabParamList = {
  Sell: undefined;
  Products: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type SellStackParamList = {
  SellHome: undefined;
  Today: undefined;
  TransactionHistory: undefined;
};

export type ProductsStackParamList = {
  ProductList: undefined;
  AddProduct: { productId?: string }; // productId = edit mode
  AdjustStock: { productId: string };
};

export type ReportsStackParamList = {
  ReportsHome: undefined;
  DailySummary: undefined;
  WeeklySummary: undefined;
  Analytics: undefined;
  Expenses: undefined;
  ExportReport: undefined;
  LoanReadiness: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  PlanSwitcher: undefined; // dev tool — plan-switcher (removed in Phase 4)
  Branches: undefined; // Business
  Staff: undefined; // Business
  Account: undefined;
  Preferences: undefined;
};

/**
 * PocketPOS — Entitlements module
 * Single source of truth for feature gating, driven by the matrix in 02_SPEC.md §6.
 *
 * In Phase 0–2 the active plan comes from a local dev plan-switcher stored in
 * AsyncStorage. In Phase 4+ it will be replaced by real subscription data from
 * the backend — search for TODO(backend) comments in this file.
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Entitlements, Plan } from '@shared/types';

const PLAN_STORAGE_KEY = '@pocketpos/dev_plan';

// ─────────────────────────────────────────────
// Entitlement matrix — mirrors 02_SPEC.md §6
// ─────────────────────────────────────────────

const ENTITLEMENT_MAP: Record<Plan, Entitlements> = {
  free: {
    plan: 'free',
    maxProducts: 20,
    maxDevices: 1,
    autoStockDeduction: false,
    autoProfitCalc: false,
    cloudBackupSync: false,
    bluetoothPrinting: false,
    analytics: false,
    expenseTracking: false,
    exportPdfCsv: false,
    financialHealthScore: false,
    multiBranch: false,
    multiUser: false,
    loanReadinessReport: false,
    dataRetentionDays: 30,
  },
  basic: {
    plan: 'basic',
    maxProducts: null, // unlimited
    maxDevices: 1,
    autoStockDeduction: true,
    autoProfitCalc: true,
    cloudBackupSync: true,
    bluetoothPrinting: true,
    analytics: false,
    expenseTracking: false,
    exportPdfCsv: false,
    financialHealthScore: false,
    multiBranch: false,
    multiUser: false,
    loanReadinessReport: false,
    dataRetentionDays: null,
  },
  pro: {
    plan: 'pro',
    maxProducts: null,
    maxDevices: 1,
    autoStockDeduction: true,
    autoProfitCalc: true,
    cloudBackupSync: true,
    bluetoothPrinting: true,
    analytics: true,
    expenseTracking: true,
    exportPdfCsv: true,
    financialHealthScore: true,
    multiBranch: false,
    multiUser: false,
    loanReadinessReport: false,
    dataRetentionDays: null,
  },
  business: {
    plan: 'business',
    maxProducts: null,
    maxDevices: 99, // effectively unlimited multi-user
    autoStockDeduction: true,
    autoProfitCalc: true,
    cloudBackupSync: true,
    bluetoothPrinting: true,
    analytics: true,
    expenseTracking: true,
    exportPdfCsv: true,
    financialHealthScore: true,
    multiBranch: true,
    multiUser: true,
    loanReadinessReport: true,
    dataRetentionDays: null,
  },
};

// ─────────────────────────────────────────────
// Runtime state
// ─────────────────────────────────────────────

let _currentPlan: Plan = 'free';

/**
 * Load the active plan.
 * TODO(backend): In Phase 4, replace the AsyncStorage read with a fetch from
 * the backend's /vendors/me endpoint (which returns the current subscription
 * plan) so the plan reflects real billing state, not just a local dev toggle.
 */
export async function loadPlan(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
    if (stored && isValidPlan(stored)) {
      _currentPlan = stored;
    }
  } catch {
    // Fail silently — default to 'free' which is the most restricted plan
  }
}

type PlanListener = (plan: Plan) => void;
const _listeners = new Set<PlanListener>();

export function subscribePlanChange(listener: PlanListener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

/**
 * Override the plan. In production this is only called by the billing webhook
 * handler after a confirmed payment. During Phases 0–2 it also powers the
 * developer plan-switcher in Settings.
 *
 * TODO(backend): In Phase 4, remove the AsyncStorage write from this function
 * (the plan will come entirely from the server). Keep the in-memory update.
 */
export async function setPlan(plan: Plan): Promise<void> {
  _currentPlan = plan;
  // TODO(backend): remove persistence of plan in AsyncStorage once real
  // billing drives the subscription state.
  await AsyncStorage.setItem(PLAN_STORAGE_KEY, plan);
  _listeners.forEach((fn) => fn(plan));
}

/** Get the current plan's entitlements object. */
export function getEntitlements(): Entitlements {
  return ENTITLEMENT_MAP[_currentPlan];
}

/** Get the current active plan name. */
export function getCurrentPlan(): Plan {
  return _currentPlan;
}

/** React hook: returns current plan and triggers re-render on changes. */
export function usePlan(): Plan {
  const [plan, setLocalPlan] = React.useState<Plan>(_currentPlan);
  React.useEffect(() => {
    setLocalPlan(_currentPlan);
    return subscribePlanChange((p) => setLocalPlan(p));
  }, []);
  return plan;
}

/** React hook: returns current entitlements and re-renders on plan changes. */
export function useEntitlements(): Entitlements {
  const plan = usePlan();
  return ENTITLEMENT_MAP[plan];
}

/** Convenience: check a single boolean capability. */
export function can(
  capability: keyof Omit<Entitlements, 'plan' | 'maxProducts' | 'maxDevices' | 'dataRetentionDays'>,
): boolean {
  return getEntitlements()[capability] as boolean;
}

/** Returns true when a feature requires a plan upgrade to access. */
export function isLocked(
  capability: keyof Omit<Entitlements, 'plan' | 'maxProducts' | 'maxDevices' | 'dataRetentionDays'>,
): boolean {
  return !can(capability);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isValidPlan(value: string): value is Plan {
  return ['free', 'basic', 'pro', 'business'].includes(value);
}

export { ENTITLEMENT_MAP };

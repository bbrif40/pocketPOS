import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { usePlan, setPlan } from '../../entitlements/entitlements';
import type { Plan } from '@shared/types';
import { THEME, commonStyles } from '../../theme/theme';

interface PlanInfo {
  id: Plan;
  label: string;
  price: string;
  tagline: string;
  features: string[];
}

const PLANS: PlanInfo[] = [
  {
    id: 'free',
    label: 'Free Plan',
    price: '₱0 / forever',
    tagline: 'Ideal for small carts and micro-stalls',
    features: [
      'Manual Sales & Change Calculator',
      '20-product limit',
      'Today summary & 30-day history',
      '100% offline local SQLite',
    ],
  },
  {
    id: 'basic',
    label: 'Basic Plan',
    price: '₱149 / month',
    tagline: 'Automatic inventory & profit calculation',
    features: [
      'Unlimited products',
      'Auto stock deduction on sale',
      'Live gross profit computation',
      'Low-stock warnings',
      'Bluetooth printing',
    ],
  },
  {
    id: 'pro',
    label: 'Pro Plan',
    price: '₱299 / month',
    tagline: 'Sales analytics & expense tracking',
    features: [
      'All Basic features',
      'Sales analytics & peak hours',
      'Payment method tracking (GCash/Cash)',
      'Expense tracking (Net Profit)',
      'Exportable PDF/CSV reports',
    ],
  },
  {
    id: 'business',
    label: 'Business Plan',
    price: '₱599 / month',
    tagline: 'Multi-branch & staff roles for growing stores',
    features: [
      'All Pro features',
      'Multi-user staff access',
      'Multi-branch management',
      'Consolidated branch reports',
      'Loan-Readiness report export',
    ],
  },
];

export function PlanSwitcherScreen() {
  const activePlan = usePlan();
  const [switching, setSwitching] = useState(false);

  const handleSelect = async (plan: Plan) => {
    setSwitching(true);
    await setPlan(plan);
    setSwitching(false);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Notice */}
        <View style={commonStyles.dashedCard}>
          <Text style={styles.noticeTitle}>🛠 DEVELOPER PLAN SWITCHER</Text>
          <Text style={styles.noticeText}>
            Instantly switches your entitlement tier. All screens will reactively re-render to
            reflect unlocked features.
          </Text>
        </View>

        {/* Plan Cards */}
        <View style={styles.plansList}>
          {PLANS.map((p) => {
            const isActive = activePlan === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.planCard, isActive && styles.planCardActive]}
                onPress={() => handleSelect(p.id)}
                activeOpacity={0.8}
                disabled={switching}
              >
                <View style={styles.planCardHeader}>
                  <View>
                    <Text style={[styles.planLabel, isActive && styles.planLabelActive]}>
                      {p.label}
                    </Text>
                    <Text style={styles.planPrice}>{p.price}</Text>
                  </View>
                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  ) : (
                    <Text style={styles.selectText}>Tap to select</Text>
                  )}
                </View>

                <Text style={styles.planTagline}>{p.tagline}</Text>

                <View style={styles.featuresList}>
                  {p.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>{isActive ? '✓' : '•'}</Text>
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  noticeTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.pine,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
  plansList: {
    gap: 12,
  },
  planCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    padding: 16,
  },
  planCardActive: {
    borderColor: THEME.colors.pine,
    backgroundColor: '#f2f7f3',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  planLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  planLabelActive: {
    color: THEME.colors.pine,
  },
  planPrice: {
    fontFamily: THEME.typography.serif,
    fontSize: 16,
    color: THEME.colors.goldDark,
    fontWeight: '700',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: THEME.colors.pine,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: THEME.colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  selectText: {
    color: THEME.colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  planTagline: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginVertical: 8,
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: '#eef2ed',
    paddingTop: 10,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    color: THEME.colors.pine,
    fontSize: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 12,
    color: THEME.colors.pine,
  },
});

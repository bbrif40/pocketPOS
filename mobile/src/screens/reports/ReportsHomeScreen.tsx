import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ReportsStackParamList } from '../../navigation/types';
import { fetchSalesHistory, fetchExpenses } from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

type Nav = NativeStackNavigationProp<ReportsStackParamList, 'ReportsHome'>;

export function ReportsHomeScreen() {
  const navigation = useNavigation<Nav>();
  const entitlements = useEntitlements();

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [sales, exps] = await Promise.all([fetchSalesHistory(), fetchExpenses()]);
      const rev = sales.reduce((acc, s) => acc + s.total_amount, 0);
      const exp = exps.reduce((acc, e) => acc + e.amount, 0);
      setTotalRevenue(rev);
      setTotalExpenses(exp);
      setSalesCount(sales.length);
    } catch (err) {
      console.error('Failed to load reports home:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.pine} />
      </View>
    );
  }

  const netIncome = totalRevenue - totalExpenses;

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerOverline}>FINANCIAL INTELLIGENCE</Text>
          <Text style={styles.headerTitle}>Ledger & Reports</Text>
        </View>

        {/* Hero Card */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>RECORDED REVENUE (LOCAL)</Text>
          <Text style={commonStyles.heroAmount}>
            ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={commonStyles.heroSubtitle}>
            {salesCount} total sales
            {entitlements.expenseTracking ? ` · Net Income: ₱${netIncome.toFixed(2)}` : ''}
          </Text>

          {/* Mini Progress bars for income vs expenses */}
          {entitlements.expenseTracking && (
            <View style={styles.balanceTrack}>
              <View
                style={[
                  styles.balanceSegment,
                  { flex: Math.max(1, totalRevenue), backgroundColor: THEME.colors.gold },
                ]}
              />
              <View
                style={[
                  styles.balanceSegment,
                  { flex: Math.max(1, totalExpenses), backgroundColor: THEME.colors.berry },
                ]}
              />
            </View>
          )}
        </View>

        {/* Navigation Grid / List */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>STATEMENTS & TRENDS</Text>

          <TouchableOpacity
            style={styles.cardNav}
            onPress={() => navigation.navigate('DailySummary')}
          >
            <View>
              <Text style={styles.cardNavTitle}>Daily Sales Summary</Text>
              <Text style={styles.cardNavSubtitle}>
                Day-by-day sales breakdown and order volume
              </Text>
            </View>
            <Text style={styles.cardNavArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardNav}
            onPress={() => navigation.navigate('WeeklySummary')}
          >
            <View>
              <Text style={styles.cardNavTitle}>Weekly Rollup</Text>
              <Text style={styles.cardNavSubtitle}>7-day comparisons and revenue trends</Text>
            </View>
            <Text style={styles.cardNavArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardNav, !entitlements.analytics && styles.cardNavLocked]}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.cardNavTitle}>Product Velocity & Analytics</Text>
                {!entitlements.analytics && <Text style={styles.lockBadge}>PRO</Text>}
              </View>
              <Text style={styles.cardNavSubtitle}>
                Top-selling goods, slow movers, peak trading hours
              </Text>
            </View>
            <Text style={styles.cardNavArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardNav, !entitlements.expenseTracking && styles.cardNavLocked]}
            onPress={() => navigation.navigate('Expenses')}
          >
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.cardNavTitle}>Store Expenses & Net Profit</Text>
                {!entitlements.expenseTracking && <Text style={styles.lockBadge}>PRO</Text>}
              </View>
              <Text style={styles.cardNavSubtitle}>
                Track stall rent, wholesale restocking, packaging
              </Text>
            </View>
            <Text style={styles.cardNavArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardNav, !entitlements.exportPdfCsv && styles.cardNavLocked]}
            onPress={() => navigation.navigate('ExportReport')}
          >
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.cardNavTitle}>Export PDF / CSV Records</Text>
                {!entitlements.exportPdfCsv && <Text style={styles.lockBadge}>PRO</Text>}
              </View>
              <Text style={styles.cardNavSubtitle}>Official proof of income downloads</Text>
            </View>
            <Text style={styles.cardNavArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cardNav, !entitlements.loanReadinessReport && styles.cardNavLocked]}
            onPress={() => navigation.navigate('LoanReadiness')}
          >
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.cardNavTitle}>Loan-Readiness Dossier</Text>
                {!entitlements.loanReadinessReport && (
                  <Text style={styles.lockBadge}>BUSINESS</Text>
                )}
              </View>
              <Text style={styles.cardNavSubtitle}>
                Pre-formatted statement for microloan lenders
              </Text>
            </View>
            <Text style={styles.cardNavArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerOverline: {
    color: THEME.colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontFamily: THEME.typography.serif,
    fontSize: 28,
    color: THEME.colors.pine,
    marginTop: 2,
  },
  balanceTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 14,
    gap: 2,
  },
  balanceSegment: {
    height: '100%',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardNav: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNavLocked: {
    opacity: 0.85,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardNavTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  cardNavSubtitle: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 3,
  },
  lockBadge: {
    backgroundColor: '#e7ede8',
    color: THEME.colors.pine,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardNavArrow: {
    fontSize: 16,
    color: THEME.colors.pine,
    fontWeight: '700',
  },
});

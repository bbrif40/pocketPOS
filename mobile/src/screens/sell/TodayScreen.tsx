import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SellStackParamList } from '../../navigation/types';
import { fetchTodayStats, type TodayStats } from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

type Nav = NativeStackNavigationProp<SellStackParamList, 'Today'>;

export function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const entitlements = useEntitlements();
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchTodayStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load today stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.pine} />
        <Text style={styles.loadingText}>Calculating today's totals…</Text>
      </View>
    );
  }

  const targetDailyGoal = 2000;
  const progressPct = Math.min(100, Math.round(((stats?.totalSales ?? 0) / targetDailyGoal) * 100));

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.pine}
          />
        }
      >
        {/* Navigation & Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionHistory')}
            style={styles.historyLink}
          >
            <Text style={styles.historyLinkText}>30-Day History →</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>TODAY'S SUMMARY · LOCAL SQLITE</Text>
          <Text style={commonStyles.heroAmount}>
            ₱{stats?.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}
          </Text>
          <Text style={commonStyles.heroSubtitle}>
            {stats?.transactionCount ?? 0} sales recorded today
          </Text>

          {/* Goal progress track (FinBar style) */}
          <View style={styles.goalSection}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>
                Daily Target: ₱{targetDailyGoal.toLocaleString()}
              </Text>
              <Text style={styles.goalPercent}>{progressPct}%</Text>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </View>

        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.metricLabel}>AVERAGE BASKET</Text>
            <Text style={styles.metricValue}>
              ₱{stats?.avgOrderValue ? stats.avgOrderValue.toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.metricHint}>Per customer sale</Text>
          </View>

          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.metricLabel}>TRANSACTIONS</Text>
            <Text style={styles.metricValue}>{stats?.transactionCount ?? 0}</Text>
            <Text style={styles.metricHint}>Completed today</Text>
          </View>
        </View>

        {/* Profit Computation Card (Tier-gated) */}
        {entitlements.autoProfitCalc ? (
          <View style={styles.profitCard}>
            <View style={styles.profitTop}>
              <View>
                <Text style={styles.profitOverline}>COMPUTED GROSS PROFIT</Text>
                <Text style={styles.profitValue}>
                  ₱{stats?.estimatedProfit ? stats.estimatedProfit.toFixed(2) : '0.00'}
                </Text>
              </View>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>{entitlements.plan.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.profitExplanation}>
              Calculated using each product's unit price minus recorded cost price.
            </Text>
          </View>
        ) : (
          <View style={commonStyles.dashedCard}>
            <View style={styles.lockRow}>
              <Text style={styles.lockIcon}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lockTitle}>Profit Computation (Basic Plan)</Text>
                <Text style={styles.lockSubtitle}>
                  Upgrade to Basic to automatically see your daily profit margin calculated from
                  item cost prices.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <Text style={styles.sectionMeta}>{stats?.sales.length ?? 0} sales</Text>
        </View>

        {stats?.sales.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No transactions yet today</Text>
            <Text style={styles.emptySubtitle}>
              Return to the Sell tab and record your first sale. All orders will instantly show up
              here.
            </Text>
          </View>
        ) : (
          <View style={styles.salesList}>
            {stats?.sales.map((sale) => {
              const timeString = new Date(sale.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <View key={sale.id} style={styles.saleItemCard}>
                  <View style={styles.saleItemLeft}>
                    <View style={styles.methodPill}>
                      <Text style={styles.methodPillText}>
                        {sale.payment_method === 'cash'
                          ? '💵 Cash'
                          : sale.payment_method === 'gcash'
                            ? '📱 GCash'
                            : '🏷 Other'}
                      </Text>
                    </View>
                    <Text style={styles.saleTime}>{timeString}</Text>
                    <Text style={styles.saleCount}>
                      · {sale.items_count} item{sale.items_count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.saleAmount}>₱{sale.total_amount.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.muted,
    marginTop: 12,
    fontSize: 14,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: THEME.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  historyLink: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  historyLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  goalSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalLabel: {
    color: THEME.colors.mutedLight,
    fontSize: 11,
    fontWeight: '600',
  },
  goalPercent: {
    color: THEME.colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  goalTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.colors.pineMuted,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: THEME.colors.gold,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  metricLabel: {
    color: THEME.colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  metricValue: {
    fontFamily: THEME.typography.serif,
    fontSize: 22,
    color: THEME.colors.pine,
    marginVertical: 4,
  },
  metricHint: {
    color: THEME.colors.muted,
    fontSize: 11,
  },
  profitCard: {
    backgroundColor: '#eaf4ee',
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: '#c0decb',
    padding: 16,
    marginBottom: 16,
  },
  profitTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profitOverline: {
    color: THEME.colors.pine,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  profitValue: {
    fontFamily: THEME.typography.serif,
    fontSize: 28,
    color: THEME.colors.pine,
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: THEME.colors.pine,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierBadgeText: {
    color: THEME.colors.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  profitExplanation: {
    color: THEME.colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockIcon: {
    fontSize: 22,
  },
  lockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginBottom: 2,
  },
  lockSubtitle: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  sectionMeta: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  emptyCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  salesList: {
    gap: 8,
  },
  saleItemCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodPill: {
    backgroundColor: '#e7ede8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  methodPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  saleTime: {
    fontSize: 13,
    color: THEME.colors.pine,
    fontWeight: '600',
  },
  saleCount: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  saleAmount: {
    fontFamily: THEME.typography.serif,
    fontSize: 17,
    color: THEME.colors.pine,
    fontWeight: '700',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { fetchSalesHistory, type SaleWithDetails } from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

export function AnalyticsScreen() {
  const entitlements = useEntitlements();
  const [bestSellers, setBestSellers] = useState<{ name: string; qty: number; revenue: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const sales: SaleWithDetails[] = await fetchSalesHistory();
      const productMap: Record<string, { qty: number; revenue: number }> = {};

      sales.forEach((s) => {
        s.items.forEach((item) => {
          if (!productMap[item.product_name]) {
            productMap[item.product_name] = { qty: 0, revenue: 0 };
          }
          productMap[item.product_name].qty += item.quantity;
          productMap[item.product_name].revenue += item.line_total;
        });
      });

      const sorted = Object.keys(productMap)
        .map((name) => ({
          name,
          qty: productMap[name].qty,
          revenue: productMap[name].revenue,
        }))
        .sort((a, b) => b.qty - a.qty);

      setBestSellers(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.pine} />
      </View>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerOverline}>PRODUCT VELOCITY & TRENDS</Text>
          <Text style={styles.headerTitle}>Sales Analytics</Text>
        </View>

        {!entitlements.analytics && (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.lockTitle}>🔒 PRO PLAN FEATURE</Text>
            <Text style={styles.lockDesc}>
              Upgrade to Pro (₱299/mo) to unlock item velocity rankings, slow-movers, and automated
              restock alerts.
            </Text>
          </View>
        )}

        {/* Hero Card */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>TOP PRODUCT PERFORMER</Text>
          <Text style={commonStyles.heroAmount}>
            {bestSellers.length > 0 ? bestSellers[0].name : 'No sales yet'}
          </Text>
          <Text style={commonStyles.heroSubtitle}>
            {bestSellers.length > 0
              ? `${bestSellers[0].qty} units sold · ₱${bestSellers[0].revenue.toFixed(2)} revenue`
              : 'Record orders to generate velocity data'}
          </Text>
        </View>

        {/* Best Sellers List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best-Selling Items</Text>
        </View>

        {bestSellers.length === 0 ? (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.emptyDesc}>No item sales data yet.</Text>
          </View>
        ) : (
          <View style={styles.rankList}>
            {bestSellers.map((item, idx) => (
              <View key={idx} style={commonStyles.card}>
                <View style={styles.rankRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>{item.qty} units moved</Text>
                  </View>
                  <Text style={styles.itemRev}>₱{item.revenue.toFixed(2)}</Text>
                </View>
              </View>
            ))}
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
  scrollContainer: {
    padding: 16,
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
  lockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pine,
    letterSpacing: 1,
    marginBottom: 4,
  },
  lockDesc: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  rankList: {
    gap: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#e7ede8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  itemSub: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  itemRev: {
    fontFamily: THEME.typography.serif,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
});

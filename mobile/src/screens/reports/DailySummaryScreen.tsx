import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { fetchSalesHistory, type SaleWithDetails } from '../../db/database';
import { THEME, commonStyles } from '../../theme/theme';

export function DailySummaryScreen() {
  const [dailyData, setDailyData] = useState<{ date: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const sales: SaleWithDetails[] = await fetchSalesHistory();
      const grouped: Record<string, { total: number; count: number }> = {};

      sales.forEach((s) => {
        const d = new Date(s.created_at).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        if (!grouped[d]) grouped[d] = { total: 0, count: 0 };
        grouped[d].total += s.total_amount;
        grouped[d].count += 1;
      });

      const list = Object.keys(grouped).map((date) => ({
        date,
        total: grouped[date].total,
        count: grouped[date].count,
      }));

      setDailyData(list);
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
          <Text style={styles.headerOverline}>DAILY REVENUE ROLLUP</Text>
          <Text style={styles.headerTitle}>Daily Summaries</Text>
        </View>

        {dailyData.length === 0 ? (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.emptyText}>
              No sales recorded yet. Completed orders will be compiled daily here.
            </Text>
          </View>
        ) : (
          <View style={styles.daysList}>
            {dailyData.map((day, idx) => (
              <View key={idx} style={commonStyles.card}>
                <View style={styles.dayTop}>
                  <View>
                    <Text style={styles.dayDate}>{day.date}</Text>
                    <Text style={styles.dayMeta}>
                      {day.count} transaction{day.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.dayTotal}>₱{day.total.toFixed(2)}</Text>
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
  emptyText: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  daysList: {
    gap: 10,
  },
  dayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDate: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  dayMeta: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  dayTotal: {
    fontFamily: THEME.typography.serif,
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { fetchSalesHistory, type SaleWithDetails } from '../../db/database';
import { THEME, commonStyles } from '../../theme/theme';

export function WeeklySummaryScreen() {
  const [weekTotal, setWeekTotal] = useState(0);
  const [dayBars, setDayBars] = useState<{ day: string; amount: number; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const sales: SaleWithDetails[] = await fetchSalesHistory();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayTotals = [0, 0, 0, 0, 0, 0, 0];

      sales.forEach((s) => {
        const d = new Date(s.created_at).getDay();
        dayTotals[d] += s.total_amount;
      });

      const total = dayTotals.reduce((a, b) => a + b, 0);
      const maxVal = Math.max(1, ...dayTotals);

      const bars = days.map((day, idx) => ({
        day,
        amount: dayTotals[idx],
        pct: Math.round((dayTotals[idx] / maxVal) * 100),
      }));

      setWeekTotal(total);
      setDayBars(bars);
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
          <Text style={styles.headerOverline}>7-DAY PERFORMANCE</Text>
          <Text style={styles.headerTitle}>Weekly Overview</Text>
        </View>

        {/* Hero Card */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>WEEK-TO-DATE SALES</Text>
          <Text style={commonStyles.heroAmount}>₱{weekTotal.toFixed(2)}</Text>
          <Text style={commonStyles.heroSubtitle}>Compiled across all daily stall activity</Text>

          {/* Day breakdown bar chart */}
          <View style={styles.chartContainer}>
            {dayBars.map((b) => (
              <View key={b.day} style={styles.barCol}>
                <View style={[styles.barFill, { height: `${Math.max(8, b.pct)}%` }]} />
                <Text style={styles.barLabel}>{b.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Day Breakdown Rows */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        </View>

        <View style={styles.daysList}>
          {dayBars.map((b) => (
            <View key={b.day} style={commonStyles.card}>
              <View style={styles.dayRow}>
                <Text style={styles.dayName}>{b.day}</Text>
                <Text style={styles.dayAmt}>₱{b.amount.toFixed(2)}</Text>
              </View>
            </View>
          ))}
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
  chartContainer: {
    flexDirection: 'row',
    height: 90,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barFill: {
    width: 14,
    backgroundColor: THEME.colors.gold,
    borderRadius: 4,
  },
  barLabel: {
    color: THEME.colors.mutedLight,
    fontSize: 10,
    fontWeight: '700',
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
  daysList: {
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  dayAmt: {
    fontFamily: THEME.typography.serif,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
});

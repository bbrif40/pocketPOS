import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { fetchExpenses, saveExpense } from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';
import type { Expense } from '@shared/types';

export function ExpensesScreen() {
  const entitlements = useEntitlements();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [category, setCategory] = useState('Restock');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const exps = await fetchExpenses();
      setExpenses(exps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddExpense = async () => {
    if (!entitlements.expenseTracking) {
      Alert.alert(
        'Pro Plan Required',
        'Expense tracking & full P&L reports are exclusive to the Pro tier (₱299/mo). Switch to Pro in Settings > Plan Switcher to unlock.',
      );
      return;
    }

    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid expense amount.');
      return;
    }

    setSaving(true);
    try {
      await saveExpense(category, parsedAmt, note.trim() || undefined);
      setAmount('');
      setNote('');
      await loadData();
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally {
      setSaving(false);
    }
  };

  const totalExpenseAmt = expenses.reduce((a, b) => a + b.amount, 0);

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.pine} />
      </View>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerOverline}>OUTFLOWS & OVERHEAD</Text>
          <Text style={styles.headerTitle}>Store Expenses</Text>
        </View>

        {!entitlements.expenseTracking && (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.lockTitle}>🔒 PRO PLAN FEATURE</Text>
            <Text style={styles.lockDesc}>
              Log stall rent, packaging, and raw ingredient purchases to see your true net take-home
              profit.
            </Text>
          </View>
        )}

        {/* Hero Card */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>TOTAL EXPENSES LOGGED</Text>
          <Text style={commonStyles.heroAmount}>
            ₱{totalExpenseAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={commonStyles.heroSubtitle}>{expenses.length} expense entries on record</Text>
        </View>

        {/* Record New Expense Form */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>LOG NEW EXPENSE</Text>

          {/* Category choices */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {['Restock', 'Stall Rent', 'Packaging', 'Transport', 'Utilities', 'Other'].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.catPill, category === c && styles.catPillActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[styles.catPillText, category === c && styles.catPillTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (₱) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={THEME.colors.muted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flour and cooking oil from market"
              placeholderTextColor={THEME.colors.muted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <TouchableOpacity
            style={[styles.addBtn, saving && styles.addBtnDisabled]}
            onPress={handleAddExpense}
            disabled={saving}
          >
            <Text style={styles.addBtnText}>{saving ? 'Saving…' : 'Record Expense →'}</Text>
          </TouchableOpacity>
        </View>

        {/* Expenses List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recorded Outflows</Text>
        </View>

        {expenses.length === 0 ? (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.emptyDesc}>No expenses logged yet.</Text>
          </View>
        ) : (
          <View style={styles.expList}>
            {expenses.map((e) => (
              <View key={e.id} style={commonStyles.card}>
                <View style={styles.expRow}>
                  <View>
                    <Text style={styles.expCat}>{e.category}</Text>
                    {e.note ? <Text style={styles.expNote}>{e.note}</Text> : null}
                    <Text style={styles.expDate}>
                      {new Date(e.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.expAmt}>−₱{e.amount.toFixed(2)}</Text>
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
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  catRow: {
    gap: 8,
    marginBottom: 12,
  },
  catPill: {
    backgroundColor: '#e7ede8',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.pill,
  },
  catPillActive: {
    backgroundColor: THEME.colors.pine,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  catPillTextActive: {
    color: THEME.colors.white,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.pine,
    marginBottom: 4,
  },
  input: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.colors.pine,
  },
  addBtn: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    color: THEME.colors.gold,
    fontSize: 14,
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
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  expList: {
    gap: 8,
  },
  expRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expCat: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  expNote: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  expDate: {
    fontSize: 11,
    color: THEME.colors.mutedLight,
    marginTop: 2,
  },
  expAmt: {
    fontFamily: THEME.typography.serif,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.berry,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { fetchSalesHistory, type SaleWithDetails } from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

export function TransactionHistoryScreen() {
  const entitlements = useEntitlements();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSalesHistory();
      setSales(data);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
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
        <Text style={styles.loadingText}>Loading history…</Text>
      </View>
    );
  }

  const totalVolume = sales.reduce((acc, s) => acc + s.total_amount, 0);

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Retention Banner */}
        <View style={styles.retentionPill}>
          <Text style={styles.retentionText}>
            {entitlements.dataRetentionDays
              ? `Showing last ${entitlements.dataRetentionDays} days (Free Plan limit)`
              : 'Showing full history (Unlimited on paid plan)'}
          </Text>
        </View>

        {/* Hero Banner */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>TRANSACTION HISTORY ARCHIVE</Text>
          <Text style={commonStyles.heroAmount}>
            ₱{totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={commonStyles.heroSubtitle}>
            {sales.length} total orders recorded locally
          </Text>
        </View>

        {/* List of transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recorded Orders</Text>
          <Text style={styles.sectionMeta}>{sales.length} records</Text>
        </View>

        {sales.length === 0 ? (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.emptyTitle}>No transaction history found</Text>
            <Text style={styles.emptySubtitle}>
              Completed sales will be preserved here for offline records.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {sales.map((sale) => {
              const dateObj = new Date(sale.created_at);
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <TouchableOpacity
                  key={sale.id}
                  style={styles.saleRow}
                  onPress={() => setSelectedSale(sale)}
                  activeOpacity={0.7}
                >
                  <View style={styles.saleRowLeft}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateDay}>{dateStr}</Text>
                      <Text style={styles.dateTime}>{timeStr}</Text>
                    </View>
                    <View style={styles.saleDetails}>
                      <Text style={styles.itemsSummary}>
                        {sale.items.length} item{sale.items.length !== 1 ? 's' : ''} (
                        {sale.items
                          .map((i) => i.product_name)
                          .slice(0, 2)
                          .join(', ')}
                        {sale.items.length > 2 ? '…' : ''})
                      </Text>
                      <Text style={styles.paymentMethodLabel}>
                        {sale.payment_method === 'cash'
                          ? '💵 Cash'
                          : sale.payment_method === 'gcash'
                            ? '📱 GCash'
                            : '🏷 Other'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.saleRowRight}>
                    <Text style={styles.saleRowAmount}>₱{sale.total_amount.toFixed(2)}</Text>
                    <Text style={styles.viewReceiptText}>Receipt →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sale Detail Receipt Modal */}
      <Modal
        visible={!!selectedSale}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedSale(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalOverline}>TRANSACTION RECEIPT</Text>
                <Text style={styles.modalId}>{selectedSale?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSale(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDate}>
              {selectedSale ? new Date(selectedSale.created_at).toLocaleString() : ''}
            </Text>

            <View style={styles.divider} />

            {/* Line items */}
            <ScrollView style={styles.itemsScroll} showsVerticalScrollIndicator={false}>
              {selectedSale?.items.map((item, idx) => (
                <View key={idx} style={styles.lineItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineItemName}>{item.product_name}</Text>
                    <Text style={styles.lineItemUnit}>
                      {item.quantity} × ₱{item.unit_price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.lineItemTotal}>₱{item.line_total.toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method</Text>
              <Text style={styles.summaryValue}>{selectedSale?.payment_method.toUpperCase()}</Text>
            </View>

            <View style={[styles.summaryRow, { marginTop: 6 }]}>
              <Text style={styles.summaryTotalLabel}>Grand Total</Text>
              <Text style={styles.summaryTotalValue}>₱{selectedSale?.total_amount.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={() => setSelectedSale(null)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  retentionPill: {
    backgroundColor: '#eaf4ee',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  retentionText: {
    fontSize: 11,
    color: THEME.colors.pine,
    fontWeight: '600',
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
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  historyList: {
    gap: 10,
  },
  saleRow: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dateBox: {
    backgroundColor: '#e7ede8',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  dateTime: {
    fontSize: 10,
    color: THEME.colors.muted,
  },
  saleDetails: {
    flex: 1,
  },
  itemsSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.pine,
    marginBottom: 3,
  },
  paymentMethodLabel: {
    fontSize: 11,
    color: THEME.colors.muted,
  },
  saleRowRight: {
    alignItems: 'flex-end',
  },
  saleRowAmount: {
    fontFamily: THEME.typography.serif,
    fontSize: 17,
    color: THEME.colors.pine,
    fontWeight: '700',
  },
  viewReceiptText: {
    fontSize: 11,
    color: THEME.colors.goldDark,
    fontWeight: '700',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 53, 43, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptModal: {
    backgroundColor: THEME.colors.card,
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalOverline: {
    color: THEME.colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  modalId: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e7ede8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: THEME.colors.pine,
    fontWeight: '700',
  },
  modalDate: {
    color: THEME.colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  itemsScroll: {
    maxHeight: 180,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  lineItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  lineItemUnit: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  lineItemTotal: {
    fontFamily: THEME.typography.serif,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: THEME.colors.muted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  summaryTotalValue: {
    fontFamily: THEME.typography.serif,
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  doneButton: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  doneButtonText: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});

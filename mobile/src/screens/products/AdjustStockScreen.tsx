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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { ProductsStackParamList } from '../../navigation/types';
import { fetchProductById, adjustStock, type ProductWithCategory } from '../../db/database';
import { THEME, commonStyles } from '../../theme/theme';
import type { StockAdjustmentReason } from '@shared/types';

type Route = RouteProp<ProductsStackParamList, 'AdjustStock'>;

export function AdjustStockScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const productId = route.params.productId;

  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [delta, setDelta] = useState<number>(1);
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState<StockAdjustmentReason>('restock');

  const loadData = useCallback(async () => {
    try {
      const p = await fetchProductById(productId);
      setProduct(p);
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async () => {
    if (!product) return;
    if (delta <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity greater than 0.');
      return;
    }

    const actualDelta = mode === 'add' ? delta : -delta;
    if (mode === 'subtract' && product.stock_qty + actualDelta < 0) {
      Alert.alert('Invalid Stock', 'Inventory quantity cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      await adjustStock(productId, actualDelta, reason);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', `Stock adjustment failed: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.pine} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    );
  }

  const newStock =
    mode === 'add' ? product.stock_qty + delta : Math.max(0, product.stock_qty - delta);

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Products</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adjust Inventory</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Current Stock Banner */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>CURRENT STOCK LEVEL</Text>
          <Text style={commonStyles.heroAmount}>{product.stock_qty} units</Text>
          <Text style={commonStyles.heroSubtitle}>{product.name}</Text>
        </View>

        {/* Add or Subtract Mode Picker */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'add' && styles.modeTabActive]}
            onPress={() => {
              setMode('add');
              setReason('restock');
            }}
          >
            <Text style={[styles.modeTabText, mode === 'add' && styles.modeTabTextActive]}>
              ＋ Restock / Add
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, mode === 'subtract' && styles.modeTabActiveSub]}
            onPress={() => {
              setMode('subtract');
              setReason('correction');
            }}
          >
            <Text style={[styles.modeTabText, mode === 'subtract' && styles.modeTabTextActive]}>
              − Deduct / Waste
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quantity Stepper Card */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>QUANTITY TO {mode === 'add' ? 'ADD' : 'SUBTRACT'}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDelta((prev) => Math.max(1, prev - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.deltaInput}
              keyboardType="numeric"
              value={String(delta)}
              onChangeText={(val) => {
                const parsed = parseInt(val, 10);
                setDelta(isNaN(parsed) ? 0 : parsed);
              }}
            />

            <TouchableOpacity style={styles.stepBtn} onPress={() => setDelta((prev) => prev + 1)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Result preview */}
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>NEW INVENTORY WILL BE</Text>
            <Text style={styles.previewValue}>{newStock} units</Text>
          </View>
        </View>

        {/* Reason Selector */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>REASON FOR ADJUSTMENT</Text>
          <View style={styles.reasonsList}>
            {(['restock', 'correction', 'spoilage', 'manual'] as StockAdjustmentReason[]).map(
              (r) => {
                const isSelected = reason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonPill, isSelected && styles.reasonPillActive]}
                    onPress={() => setReason(r)}
                  >
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.applyButton, saving && styles.applyButtonDisabled]}
          onPress={handleApply}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.applyButtonText}>
            {saving ? 'Updating…' : `Update to ${newStock} Units →`}
          </Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: THEME.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  backBtnText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: THEME.typography.serif,
    fontSize: 22,
    color: THEME.colors.pine,
  },
  errorText: {
    color: THEME.colors.danger,
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: THEME.colors.pine,
    borderColor: THEME.colors.pine,
  },
  modeTabActiveSub: {
    backgroundColor: THEME.colors.pine,
    borderColor: THEME.colors.pine,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  modeTabTextActive: {
    color: THEME.colors.white,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 10,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e7ede8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  deltaInput: {
    width: 80,
    height: 48,
    backgroundColor: THEME.colors.white,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  previewBox: {
    marginTop: 14,
    backgroundColor: '#f1f5f2',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1,
  },
  previewValue: {
    fontFamily: THEME.typography.serif,
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginTop: 2,
  },
  reasonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonPill: {
    backgroundColor: '#e7ede8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  reasonPillActive: {
    backgroundColor: THEME.colors.pine,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  reasonTextActive: {
    color: THEME.colors.gold,
  },
  applyButton: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: THEME.colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
});

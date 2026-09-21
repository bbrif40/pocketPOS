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
import { fetchProductById, fetchCategories, saveProduct } from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

type Route = RouteProp<ProductsStackParamList, 'AddProduct'>;

export function AddProductScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const entitlements = useEntitlements();
  const editId = route.params?.productId;

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQty, setStockQty] = useState('10');
  const [reorderThreshold, setReorderThreshold] = useState('5');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const loadData = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);

      if (editId) {
        const prod = await fetchProductById(editId);
        if (prod) {
          setName(prod.name);
          setPrice(String(prod.price));
          setCostPrice(prod.cost_price ? String(prod.cost_price) : '');
          setStockQty(String(prod.stock_qty));
          setReorderThreshold(String(prod.reorder_threshold));
          setCategoryId(prod.category_id ?? null);
        }
      }
    } catch (err) {
      console.error('Failed to load add product data:', err);
    } finally {
      setLoading(false);
    }
  }, [editId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a product name.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than ₱0.');
      return;
    }

    const parsedCost = costPrice.trim() ? parseFloat(costPrice) : null;
    const parsedStock = parseInt(stockQty, 10) || 0;
    const parsedReorder = parseInt(reorderThreshold, 10) || 5;

    setSaving(true);
    try {
      await saveProduct({
        id: editId,
        name: name.trim(),
        price: parsedPrice,
        cost_price: parsedCost,
        category_id: categoryId,
        stock_qty: parsedStock,
        reorder_threshold: parsedReorder,
      });

      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', `Failed to save product: ${String(err)}`);
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

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editId ? 'Edit Product' : 'New Product'}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Basic Info Card */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>ITEM DETAILS</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pandesal (Pack of 10)"
              placeholderTextColor={THEME.colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Selling Price (₱) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={THEME.colors.muted}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>
                Cost Price (₱) {!entitlements.autoProfitCalc && '🔒'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={THEME.colors.muted}
                keyboardType="numeric"
                value={costPrice}
                onChangeText={setCostPrice}
              />
            </View>
          </View>
          <Text style={styles.inputHint}>
            Cost price is used to calculate your profit per item on Basic/Pro plans.
          </Text>
        </View>

        {/* Category Picker */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catPills}
          >
            <TouchableOpacity
              style={[styles.catPill, categoryId === null && styles.catPillActive]}
              onPress={() => setCategoryId(null)}
            >
              <Text style={[styles.catPillText, categoryId === null && styles.catPillTextActive]}>
                None
              </Text>
            </TouchableOpacity>
            {categories.map((c) => {
              const active = categoryId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catPill, active && styles.catPillActive]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text style={[styles.catPillText, active && styles.catPillTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Inventory Stock Settings */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>INVENTORY STOCK</Text>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Initial Stock Qty</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={stockQty}
                onChangeText={setStockQty}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Low-Stock Alert Qty</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={reorderThreshold}
                onChangeText={setReorderThreshold}
              />
            </View>
          </View>
          <Text style={styles.inputHint}>
            A warning badge appears when inventory drops to or below the alert quantity.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving…' : editId ? 'Save Changes →' : 'Create Product →'}
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
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.pine,
    marginBottom: 6,
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHint: {
    fontSize: 11,
    color: THEME.colors.muted,
    lineHeight: 15,
  },
  catPills: {
    gap: 8,
  },
  catPill: {
    backgroundColor: '#e7ede8',
    paddingVertical: 7,
    paddingHorizontal: 14,
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
  saveButton: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: THEME.colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
});

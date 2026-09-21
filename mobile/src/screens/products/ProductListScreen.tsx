import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProductsStackParamList } from '../../navigation/types';
import { fetchProducts, archiveProduct, type ProductWithCategory } from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductList'>;

export function ProductListScreen() {
  const navigation = useNavigation<Nav>();
  const entitlements = useEntitlements();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleAddProduct = () => {
    if (entitlements.maxProducts !== null && products.length >= entitlements.maxProducts) {
      Alert.alert(
        'Product Limit Reached (Free Plan)',
        `The Free plan is limited to ${entitlements.maxProducts} active products. Switch to Basic or Pro in Settings > Plan Switcher for unlimited products!`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => {
              // Nav to plan switcher if possible
            },
          },
        ],
      );
      return;
    }
    navigation.navigate('AddProduct', {});
  };

  const handleArchive = (product: ProductWithCategory) => {
    Alert.alert('Archive Product', `Are you sure you want to archive "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archiveProduct(product.id);
          loadData();
        },
      },
    ]);
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q)),
    );
  }, [products, searchQuery]);

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.pine} />
        <Text style={styles.loadingText}>Loading inventory…</Text>
      </View>
    );
  }

  const freeCap = entitlements.maxProducts ?? 20;
  const usagePct = Math.min(100, Math.round((products.length / freeCap) * 100));

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title and Add Button */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerOverline}>STORE INVENTORY</Text>
            <Text style={styles.headerTitle}>Products</Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddProduct} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ New Product</Text>
          </TouchableOpacity>
        </View>

        {/* Free Tier Capacity Card (Common Ground style progress) */}
        {entitlements.maxProducts !== null && (
          <View style={styles.quotaCard}>
            <View style={styles.quotaHeader}>
              <Text style={styles.quotaLabel}>FREE TIER CAPACITY</Text>
              <Text style={styles.quotaValue}>
                {products.length} of {entitlements.maxProducts} products
              </Text>
            </View>
            <View style={styles.quotaTrack}>
              <View style={[styles.quotaFill, { width: `${usagePct}%` }]} />
            </View>
            {products.length >= entitlements.maxProducts && (
              <Text style={styles.quotaWarning}>
                Limit reached. Upgrade to Basic for unlimited items.
              </Text>
            )}
          </View>
        )}

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor={THEME.colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Product List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Items</Text>
          <Text style={styles.sectionMeta}>{filteredProducts.length} items listed</Text>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ New Product" above to create your first item.
            </Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((p) => {
              const isLowStock = p.stock_qty <= p.reorder_threshold;
              const isOutOfStock = p.stock_qty <= 0;

              return (
                <View key={p.id} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <View style={{ flex: 1 }}>
                      {p.category_name && (
                        <Text style={styles.itemCategory}>{p.category_name.toUpperCase()}</Text>
                      )}
                      <Text style={styles.itemName}>{p.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.itemPrice}>₱{p.price.toFixed(2)}</Text>
                        {p.cost_price ? (
                          <Text style={styles.costPrice}> (Cost: ₱{p.cost_price.toFixed(2)})</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.stockBadgeContainer}>
                      <View
                        style={[
                          styles.stockPill,
                          isOutOfStock
                            ? styles.stockPillOut
                            : isLowStock
                              ? styles.stockPillLow
                              : styles.stockPillGood,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stockPillText,
                            isOutOfStock
                              ? styles.stockPillTextOut
                              : isLowStock
                                ? styles.stockPillTextLow
                                : styles.stockPillTextGood,
                          ]}
                        >
                          {isOutOfStock ? '0 in stock' : `${p.stock_qty} in stock`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => navigation.navigate('AdjustStock', { productId: p.id })}
                    >
                      <Text style={styles.actionPillText}>± Adjust Stock</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionPill}
                      onPress={() => navigation.navigate('AddProduct', { productId: p.id })}
                    >
                      <Text style={styles.actionPillText}>✎ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionPill, styles.actionPillArchive]}
                      onPress={() => handleArchive(p)}
                    >
                      <Text style={styles.actionPillTextArchive}>Archive</Text>
                    </TouchableOpacity>
                  </View>
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
  addBtn: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  addBtnText: {
    color: THEME.colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  quotaCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 14,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quotaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1,
  },
  quotaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  quotaTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dce8df',
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
    backgroundColor: THEME.colors.moss,
    borderRadius: 3,
  },
  quotaWarning: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.pine,
    padding: 0,
  },
  clearSearch: {
    color: THEME.colors.muted,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
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
  productList: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 14,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  itemPrice: {
    fontFamily: THEME.typography.serif,
    fontSize: 18,
    color: THEME.colors.pine,
    fontWeight: '700',
  },
  costPrice: {
    fontSize: 12,
    color: THEME.colors.muted,
  },
  stockBadgeContainer: {
    alignItems: 'flex-end',
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockPillGood: {
    backgroundColor: '#e7ede8',
  },
  stockPillLow: {
    backgroundColor: '#faebd7',
  },
  stockPillOut: {
    backgroundColor: '#f6dedf',
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockPillTextGood: {
    color: THEME.colors.pine,
  },
  stockPillTextLow: {
    color: THEME.colors.goldDark,
  },
  stockPillTextOut: {
    color: THEME.colors.danger,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2ed',
    paddingTop: 10,
    justifyContent: 'flex-end',
  },
  actionPill: {
    backgroundColor: '#e7ede8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  actionPillArchive: {
    backgroundColor: 'transparent',
  },
  actionPillTextArchive: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.danger,
  },
});

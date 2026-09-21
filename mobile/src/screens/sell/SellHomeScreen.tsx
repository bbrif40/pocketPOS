import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SellStackParamList } from '../../navigation/types';
import {
  fetchProducts,
  fetchTodayStats,
  recordSale,
  type ProductWithCategory,
  type TodayStats,
} from '../../db/database';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';
import type { PaymentMethod } from '@shared/types';

type Nav = NativeStackNavigationProp<SellStackParamList, 'SellHome'>;

interface CartItemState {
  product: ProductWithCategory;
  quantity: number;
}

export function SellHomeScreen() {
  const navigation = useNavigation<Nav>();
  const entitlements = useEntitlements();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, CartItemState>>({});

  // Checkout Calculator Modal
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  // Success Receipt Modal
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [lastSaleInfo, setLastSaleInfo] = useState<{
    total: number;
    cashTendered: number;
    changeDue: number;
    itemsCount: number;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [prods, stats] = await Promise.all([fetchProducts(), fetchTodayStats()]);
      setProducts(prods);
      setTodayStats(stats);
    } catch (err) {
      console.error('Failed to load sell home data:', err);
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

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === 'all' ||
        (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase());
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // 7 days of the week for the hero graph
  const weekDays = useMemo(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const jsDay = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const todayIdx = jsDay === 0 ? 6 : jsDay - 1; // Mon = 0 ... Sun = 6

    const baseValues = [45, 60, 50, 75, 68, 92, 80];
    if (todayStats && todayStats.totalSales > 0) {
      baseValues[todayIdx] = Math.max(
        30,
        Math.min(100, Math.round((todayStats.totalSales / 200) * 85)),
      );
    }

    return dayLabels.map((day, idx) => ({
      day,
      isToday: idx === todayIdx,
      heightPct: baseValues[idx],
    }));
  }, [todayStats]);

  // Direct 1-tap product addition on button tap
  const handleProductTap = (product: ProductWithCategory) => {
    if (product.stock_qty <= 0) {
      Alert.alert('Out of Stock', `"${product.name}" has 0 units left in inventory.`);
      return;
    }
    setCart((prev) => {
      const currentQty = prev[product.id]?.quantity ?? 0;
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: currentQty + 1,
        },
      };
    });
  };

  // Decrement quantity if owner tapped accidentally
  const handleDecrement = (productId: string) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      };
    });
  };

  const clearCart = () => setCart({});

  const cartList = Object.values(cart);
  const totalAmount = useMemo(() => {
    return cartList.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  }, [cartList]);

  const totalItemsCount = useMemo(() => {
    return cartList.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartList]);

  // Cash and change calculations
  const parsedCash = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, parsedCash - totalAmount);
  const remainingDue = Math.max(0, totalAmount - parsedCash);

  const handleOpenCheckout = () => {
    if (totalAmount <= 0) return;
    setCashTendered(String(totalAmount));
    setPaymentMethod('cash');
    setCheckoutVisible(true);
  };

  const handleConfirmSale = async () => {
    if (cartList.length === 0) return;
    if (paymentMethod === 'cash' && parsedCash < totalAmount) {
      Alert.alert('Insufficient Cash', `Customer still owes ₱${remainingDue.toFixed(2)}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const itemsToRecord = cartList.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      }));

      await recordSale({
        items: itemsToRecord,
        totalAmount,
        paymentMethod,
      });

      setLastSaleInfo({
        total: totalAmount,
        cashTendered: paymentMethod === 'cash' ? parsedCash : totalAmount,
        changeDue: paymentMethod === 'cash' ? changeDue : 0,
        itemsCount: totalItemsCount,
      });

      setCheckoutVisible(false);
      clearCart();
      setReceiptModalVisible(true);
      await loadData();
    } catch (err) {
      Alert.alert('Sale Failed', String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={THEME.colors.pine} />
        <Text style={styles.loadingText}>Opening PocketPOS…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Scrollable Main Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandSubtitle}>ANYA & MAYA · SARI-SARI STORE</Text>
            <Text style={styles.brandTitle}>PocketPOS</Text>
          </View>
        </View>

        {/* Hero Card: Today's Revenue & Stats */}
        <View style={commonStyles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={commonStyles.heroOverline}>TODAY'S REGISTER · LOCAL SQLITE</Text>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>READY</Text>
            </View>
          </View>

          <Text style={commonStyles.heroAmount}>
            ₱
            {todayStats
              ? todayStats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })
              : '0.00'}
          </Text>

          <Text style={commonStyles.heroSubtitle}>
            {todayStats?.transactionCount ?? 0} sales recorded today
            {todayStats?.avgOrderValue ? ` · ₱${todayStats.avgOrderValue.toFixed(2)}/avg` : ''}
          </Text>

          {/* 7 Days of Week Bar Graph */}
          <View style={styles.sparklineContainer}>
            {weekDays.map((item, idx) => (
              <View key={idx} style={styles.sparklineCol}>
                <View style={styles.sparklineBarWrapper}>
                  <View
                    style={[
                      styles.sparklineBar,
                      {
                        height: `${item.heightPct}%`,
                        backgroundColor: item.isToday ? THEME.colors.gold : THEME.colors.moss,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.sparklineDayText, item.isToday && styles.sparklineDayTextToday]}
                >
                  {item.day}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.heroActionButton}
            onPress={() => navigation.navigate('Today')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroActionText}>Review today's ledger</Text>
            <Text style={styles.heroActionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items by name…"
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

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Instruction subheader */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Sell Catalog</Text>
            <Text style={styles.instructionText}>
              Tap any product button to add to current order
            </Text>
          </View>
          <Text style={styles.sectionMeta}>{filteredProducts.length} items</Text>
        </View>

        {/* Product Buttons Grid */}
        {filteredProducts.length === 0 ? (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptySubtitle}>
              Try changing your filter or add items in the Products tab.
            </Text>
          </View>
        ) : (
          <View style={styles.productButtonGrid}>
            {filteredProducts.map((prod) => {
              const qtyInCart = cart[prod.id]?.quantity ?? 0;
              const isSelected = qtyInCart > 0;
              const isLowStock = prod.stock_qty <= prod.reorder_threshold;
              const isOutOfStock = prod.stock_qty <= 0;

              return (
                <TouchableOpacity
                  key={prod.id}
                  style={[
                    styles.productButton,
                    isSelected && styles.productButtonSelected,
                    isOutOfStock && styles.productButtonDisabled,
                  ]}
                  onPress={() => handleProductTap(prod)}
                  activeOpacity={0.7}
                  disabled={isOutOfStock}
                >
                  {/* Top metadata: Category tag & Selected counter badge */}
                  <View style={styles.buttonTopRow}>
                    {prod.category_name ? (
                      <Text style={styles.buttonCategoryTag}>
                        {prod.category_name.toUpperCase()}
                      </Text>
                    ) : (
                      <View />
                    )}

                    {isSelected && (
                      <View style={styles.selectedCountBadge}>
                        <Text style={styles.selectedCountText}>{qtyInCart}x</Text>
                        <TouchableOpacity
                          style={styles.badgeMinusBtn}
                          onPress={() => handleDecrement(prod.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.badgeMinusText}>−</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Product Title */}
                  <Text
                    style={[
                      styles.buttonProductName,
                      isSelected && styles.buttonProductNameSelected,
                    ]}
                  >
                    {prod.name}
                  </Text>

                  {/* Bottom details: Price & Inventory Stock */}
                  <View style={styles.buttonBottomRow}>
                    <Text style={styles.buttonPrice}>₱{prod.price.toFixed(2)}</Text>

                    <View
                      style={[
                        styles.inventoryPill,
                        isOutOfStock
                          ? styles.inventoryPillOut
                          : isLowStock
                            ? styles.inventoryPillLow
                            : styles.inventoryPillGood,
                      ]}
                    >
                      <Text
                        style={[
                          styles.inventoryText,
                          isOutOfStock
                            ? styles.inventoryTextOut
                            : isLowStock
                              ? styles.inventoryTextLow
                              : styles.inventoryTextGood,
                        ]}
                      >
                        {isOutOfStock ? 'Sold out' : `${prod.stock_qty} in stock`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Space at bottom so scrolling clears the docked running total bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Persistent Dynamic Running Total Bar (Always docked at bottom) */}
      <View style={styles.runningTotalBar}>
        <View style={styles.runningTotalLeft}>
          <View style={[styles.runningBadge, totalItemsCount > 0 && styles.runningBadgeActive]}>
            <Text style={styles.runningBadgeText}>{totalItemsCount}</Text>
          </View>
          <View>
            <Text style={styles.runningLabel}>
              {totalItemsCount === 0
                ? 'CURRENT ORDER'
                : `${totalItemsCount} ITEM${totalItemsCount !== 1 ? 'S' : ''} ADDED`}
            </Text>
            <Text style={styles.runningAmount}>₱{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.runningTotalRight}>
          {totalItemsCount > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.chargeBtn, totalItemsCount === 0 && styles.chargeBtnDisabled]}
            onPress={handleOpenCheckout}
            disabled={totalItemsCount === 0}
            activeOpacity={0.85}
          >
            <Text
              style={[styles.chargeBtnText, totalItemsCount === 0 && styles.chargeBtnTextDisabled]}
            >
              Charge ₱{totalAmount.toFixed(2)}
            </Text>
            <Text
              style={[styles.chargeBtnArrow, totalItemsCount === 0 && styles.chargeBtnTextDisabled]}
            >
              →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cash & Change Calculator Modal */}
      <Modal
        visible={checkoutVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutSheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetOverline}>CASH & CHANGE CALCULATOR</Text>
                <Text style={styles.sheetTitle}>Ring Up Sale</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCheckoutVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Total Due Banner */}
            <View style={styles.dueBanner}>
              <Text style={styles.dueBannerLabel}>AMOUNT DUE</Text>
              <Text style={styles.dueBannerAmount}>₱{totalAmount.toFixed(2)}</Text>
              <Text style={styles.dueBannerSub}>{totalItemsCount} items selected</Text>
            </View>

            {/* Payment Method Tabs */}
            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodTab,
                  paymentMethod === 'cash' && styles.paymentMethodTabActive,
                ]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'cash' && styles.paymentMethodTextActive,
                  ]}
                >
                  💵 Cash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodTab,
                  paymentMethod === 'gcash' && styles.paymentMethodTabActive,
                  !entitlements.analytics && styles.paymentMethodTabLocked,
                ]}
                onPress={() => {
                  if (entitlements.analytics) {
                    setPaymentMethod('gcash');
                  } else {
                    Alert.alert(
                      'Pro Plan Feature',
                      'GCash & payment method tracking is available on the Pro tier. You can switch to Pro in Settings > Plan Switcher.',
                    );
                  }
                }}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'gcash' && styles.paymentMethodTextActive,
                  ]}
                >
                  📱 GCash {!entitlements.analytics && '🔒'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodTab,
                  paymentMethod === 'other' && styles.paymentMethodTabActive,
                ]}
                onPress={() => setPaymentMethod('other')}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === 'other' && styles.paymentMethodTextActive,
                  ]}
                >
                  🏷 Other
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cash Calculator Controls */}
            {paymentMethod === 'cash' && (
              <View style={styles.cashSection}>
                <Text style={styles.cashLabel}>CASH TENDERED BY CUSTOMER</Text>
                <View style={styles.cashInputWrapper}>
                  <Text style={styles.cashPrefix}>₱</Text>
                  <TextInput
                    style={styles.cashInput}
                    keyboardType="numeric"
                    value={cashTendered}
                    onChangeText={setCashTendered}
                    placeholder="0.00"
                    placeholderTextColor={THEME.colors.muted}
                  />
                  {cashTendered.length > 0 && (
                    <TouchableOpacity onPress={() => setCashTendered('')}>
                      <Text style={styles.clearInput}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Quick Bills Row */}
                <View style={styles.quickBillsRow}>
                  <TouchableOpacity
                    style={styles.quickBillPill}
                    onPress={() => setCashTendered(String(totalAmount))}
                  >
                    <Text style={styles.quickBillText}>Exact</Text>
                  </TouchableOpacity>
                  {[50, 100, 200, 500, 1000].map((bill) => (
                    <TouchableOpacity
                      key={bill}
                      style={styles.quickBillPill}
                      onPress={() => setCashTendered(String(bill))}
                    >
                      <Text style={styles.quickBillText}>₱{bill}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Change Due Card */}
                <View
                  style={[
                    styles.changeCard,
                    parsedCash >= totalAmount
                      ? styles.changeCardSufficient
                      : styles.changeCardInsufficient,
                  ]}
                >
                  <View>
                    <Text style={styles.changeLabel}>
                      {parsedCash >= totalAmount ? 'CHANGE DUE' : 'STILL SHORT'}
                    </Text>
                    <Text style={styles.changeAmount}>
                      ₱{parsedCash >= totalAmount ? changeDue.toFixed(2) : remainingDue.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.changeStatusIcon}>
                    {parsedCash >= totalAmount ? '✓ Ready' : '⚠️ Need more'}
                  </Text>
                </View>
              </View>
            )}

            {/* Confirm Sale Button */}
            <TouchableOpacity
              style={[styles.confirmButton, isProcessing && styles.confirmButtonDisabled]}
              onPress={handleConfirmSale}
              disabled={isProcessing}
            >
              <Text style={styles.confirmButtonText}>
                {isProcessing ? 'Recording…' : `Confirm Sale · ₱${totalAmount.toFixed(2)} →`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sale Complete Receipt Modal */}
      <Modal
        visible={receiptModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setReceiptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptIconCircle}>
              <Text style={styles.receiptIconCheck}>✓</Text>
            </View>

            <Text style={styles.receiptStoreName}>ANYA & MAYA SARI-SARI</Text>
            <Text style={styles.receiptTitle}>Sale Recorded!</Text>
            <Text style={styles.receiptDate}>
              {new Date().toLocaleTimeString()} · Saved to local SQLite
            </Text>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptRowLabel}>Total Amount</Text>
              <Text style={styles.receiptRowValue}>₱{lastSaleInfo?.total.toFixed(2)}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptRowLabel}>Cash Tendered</Text>
              <Text style={styles.receiptRowValue}>₱{lastSaleInfo?.cashTendered.toFixed(2)}</Text>
            </View>

            <View style={[styles.receiptRow, styles.receiptRowHighlight]}>
              <Text style={styles.receiptChangeLabel}>Change Given</Text>
              <Text style={styles.receiptChangeValue}>₱{lastSaleInfo?.changeDue.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.newSaleButton}
              onPress={() => setReceiptModalVisible(false)}
            >
              <Text style={styles.newSaleButtonText}>New Transaction →</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandSubtitle: {
    color: THEME.colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  brandTitle: {
    fontFamily: THEME.typography.serif,
    fontSize: 28,
    color: THEME.colors.pine,
    marginTop: 2,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: THEME.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: THEME.colors.pine,
    fontSize: 11,
    fontWeight: '700',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 214, 125, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.gold,
    marginRight: 5,
  },
  liveText: {
    color: THEME.colors.gold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sparklineContainer: {
    height: 85,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
    marginTop: 16,
    marginBottom: 16,
  },
  sparklineCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sparklineBarWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sparklineBar: {
    width: '75%',
    maxWidth: 22,
    borderRadius: 4,
  },
  sparklineDayText: {
    color: THEME.colors.mutedLight,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  sparklineDayTextToday: {
    color: THEME.colors.gold,
    fontWeight: '800',
  },
  heroActionButton: {
    backgroundColor: THEME.colors.gold,
    borderRadius: THEME.radius.button,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroActionText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  heroActionArrow: {
    color: THEME.colors.pine,
    fontSize: 15,
    fontWeight: '700',
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
    marginBottom: 12,
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
  categoryScroll: {
    paddingBottom: 10,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(248, 250, 247, 0.8)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: THEME.radius.pill,
  },
  categoryPillActive: {
    backgroundColor: THEME.colors.pine,
    borderColor: THEME.colors.pine,
  },
  categoryPillText: {
    fontSize: 12,
    color: THEME.colors.pine,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: THEME.colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  instructionText: {
    fontSize: 11,
    color: THEME.colors.muted,
    marginTop: 1,
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

  // Tactile Product Buttons Grid
  productButtonGrid: {
    gap: 12,
  },
  productButton: {
    backgroundColor: THEME.colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    padding: 16,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  productButtonSelected: {
    borderColor: THEME.colors.pine,
    backgroundColor: '#f2f7f3',
    borderWidth: 2,
  },
  productButtonDisabled: {
    opacity: 0.5,
  },
  buttonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  buttonCategoryTag: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 0.8,
  },
  selectedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.gold,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 6,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  badgeMinusBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(23, 53, 43, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeMinusText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pine,
    lineHeight: 14,
  },
  buttonProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginBottom: 10,
  },
  buttonProductNameSelected: {
    color: THEME.colors.pine,
  },
  buttonBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eef2ed',
    paddingTop: 10,
  },
  buttonPrice: {
    fontFamily: THEME.typography.serif,
    fontSize: 20,
    color: THEME.colors.pine,
    fontWeight: '700',
  },
  inventoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inventoryPillGood: {
    backgroundColor: '#e7ede8',
  },
  inventoryPillLow: {
    backgroundColor: '#faebd7',
  },
  inventoryPillOut: {
    backgroundColor: '#f6dedf',
  },
  inventoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inventoryTextGood: {
    color: THEME.colors.pine,
  },
  inventoryTextLow: {
    color: THEME.colors.goldDark,
  },
  inventoryTextOut: {
    color: THEME.colors.danger,
  },

  // Persistent Docked Running Total Bar
  runningTotalBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.pine,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  runningTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runningBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#31574a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  runningBadgeActive: {
    backgroundColor: THEME.colors.gold,
  },
  runningBadgeText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  runningLabel: {
    color: THEME.colors.mutedLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  runningAmount: {
    fontFamily: THEME.typography.serif,
    color: THEME.colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  runningTotalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  clearBtnText: {
    color: THEME.colors.mutedLight,
    fontSize: 12,
    fontWeight: '600',
  },
  chargeBtn: {
    backgroundColor: THEME.colors.gold,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chargeBtnDisabled: {
    backgroundColor: '#31574a',
    opacity: 0.6,
  },
  chargeBtnText: {
    color: THEME.colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  chargeBtnTextDisabled: {
    color: THEME.colors.mutedLight,
  },
  chargeBtnArrow: {
    color: THEME.colors.pine,
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 53, 43, 0.65)',
    justifyContent: 'flex-end',
  },
  checkoutSheet: {
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetOverline: {
    color: THEME.colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sheetTitle: {
    fontFamily: THEME.typography.serif,
    fontSize: 24,
    color: THEME.colors.pine,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e7ede8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: THEME.colors.pine,
    fontSize: 14,
    fontWeight: '700',
  },
  dueBanner: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  dueBannerLabel: {
    color: THEME.colors.mutedLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dueBannerAmount: {
    fontFamily: THEME.typography.serif,
    fontSize: 40,
    color: THEME.colors.gold,
    marginVertical: 4,
  },
  dueBannerSub: {
    color: THEME.colors.mutedLight,
    fontSize: 12,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  paymentMethodTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    backgroundColor: '#f1f5f2',
  },
  paymentMethodTabActive: {
    backgroundColor: THEME.colors.pine,
    borderColor: THEME.colors.pine,
  },
  paymentMethodTabLocked: {
    opacity: 0.7,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  paymentMethodTextActive: {
    color: THEME.colors.white,
  },
  cashSection: {
    marginBottom: 18,
  },
  cashLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  cashInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.white,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cashPrefix: {
    fontFamily: THEME.typography.serif,
    fontSize: 22,
    color: THEME.colors.pine,
    marginRight: 6,
  },
  cashInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.pine,
    padding: 0,
  },
  clearInput: {
    color: THEME.colors.muted,
    fontSize: 16,
    paddingHorizontal: 6,
  },
  quickBillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  quickBillPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#e7ede8',
  },
  quickBillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  changeCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  changeCardSufficient: {
    backgroundColor: '#eaf4ee',
    borderWidth: 1,
    borderColor: '#c0decb',
  },
  changeCardInsufficient: {
    backgroundColor: '#fef3e7',
    borderWidth: 1,
    borderColor: '#fbd7b2',
  },
  changeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1,
  },
  changeAmount: {
    fontFamily: THEME.typography.serif,
    fontSize: 24,
    color: THEME.colors.pine,
    marginTop: 2,
  },
  changeStatusIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  confirmButton: {
    backgroundColor: THEME.colors.pine,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: THEME.colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  receiptCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 24,
    padding: 24,
    margin: 24,
    alignItems: 'center',
  },
  receiptIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.pine,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  receiptIconCheck: {
    color: THEME.colors.gold,
    fontSize: 24,
    fontWeight: '700',
  },
  receiptStoreName: {
    color: THEME.colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  receiptTitle: {
    fontFamily: THEME.typography.serif,
    fontSize: 26,
    color: THEME.colors.pine,
    marginTop: 4,
    marginBottom: 2,
  },
  receiptDate: {
    color: THEME.colors.muted,
    fontSize: 11,
    marginBottom: 16,
  },
  receiptDivider: {
    width: '100%',
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  receiptRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  receiptRowLabel: {
    color: THEME.colors.muted,
    fontSize: 13,
  },
  receiptRowValue: {
    color: THEME.colors.pine,
    fontSize: 14,
    fontWeight: '600',
  },
  receiptRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    marginTop: 6,
    paddingTop: 10,
  },
  receiptChangeLabel: {
    color: THEME.colors.pine,
    fontSize: 14,
    fontWeight: '700',
  },
  receiptChangeValue: {
    fontFamily: THEME.typography.serif,
    fontSize: 20,
    color: THEME.colors.pine,
    fontWeight: '700',
  },
  newSaleButton: {
    backgroundColor: THEME.colors.gold,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  newSaleButtonText: {
    color: THEME.colors.pine,
    fontSize: 14,
    fontWeight: '700',
  },
});

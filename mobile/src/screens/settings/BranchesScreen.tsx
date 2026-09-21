import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { THEME, commonStyles } from '../../theme/theme';
import { useEntitlements } from '../../entitlements/entitlements';

interface BranchItem {
  id: string;
  name: string;
  location: string;
  isMain: boolean;
}

export function BranchesScreen() {
  const entitlements = useEntitlements();
  const [branches, setBranches] = useState<BranchItem[]>([
    {
      id: 'b_1',
      name: 'Main Stall · Poblacion Market',
      location: 'Stall 14, Public Market',
      isMain: true,
    },
    {
      id: 'b_2',
      name: 'Cart #2 · City Plaza',
      location: 'Corner Rizal & Burgos St.',
      isMain: false,
    },
  ]);

  const handleAddBranch = () => {
    if (!entitlements.multiBranch) {
      Alert.alert(
        'Business Plan Required',
        'Multi-branch management is exclusive to the Business Plan (₱599/mo). Switch to Business in Settings > Plan Switcher to unlock.',
      );
      return;
    }
    const newId = `b_${Date.now()}`;
    setBranches((prev) => [
      ...prev,
      { id: newId, name: `Branch #${prev.length + 1}`, location: 'New Location', isMain: false },
    ]);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerOverline}>PHYSICAL LOCATIONS</Text>
          <Text style={styles.headerTitle}>Branches</Text>
        </View>

        {!entitlements.multiBranch && (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.lockTitle}>🔒 BUSINESS PLAN FEATURE</Text>
            <Text style={styles.lockSubtitle}>
              Multi-branch management allows owners to consolidate sales, inventory, and staff
              across multiple stalls or carts.
            </Text>
          </View>
        )}

        <View style={styles.branchList}>
          {branches.map((b) => (
            <View key={b.id} style={commonStyles.card}>
              <View style={styles.branchTop}>
                <View>
                  <Text style={styles.branchName}>{b.name}</Text>
                  <Text style={styles.branchLoc}>{b.location}</Text>
                </View>
                {b.isMain && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>PRIMARY</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addBranchButton}
          onPress={handleAddBranch}
          activeOpacity={0.85}
        >
          <Text style={styles.addBranchText}>+ Add Another Branch</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  lockSubtitle: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
  branchList: {
    gap: 10,
  },
  branchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  branchLoc: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  mainBadge: {
    backgroundColor: THEME.colors.pine,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mainBadgeText: {
    color: THEME.colors.gold,
    fontSize: 9,
    fontWeight: '700',
  },
  addBranchButton: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  addBranchText: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';
import { usePlan } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

export function SettingsHomeScreen() {
  const navigation = useNavigation<Nav>();
  const currentPlan = usePlan();

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerOverline}>PREFERENCES & CONTROLS</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Current Plan Card (Common Ground hero banner) */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>CURRENT ENTITLEMENT TIER</Text>
          <Text style={commonStyles.heroAmount}>{currentPlan.toUpperCase()}</Text>
          <Text style={commonStyles.heroSubtitle}>
            {currentPlan === 'free'
              ? 'Local SQLite mode · 20 product cap'
              : currentPlan === 'basic'
                ? 'Unlimited products · Auto stock & profit calc'
                : currentPlan === 'pro'
                  ? 'Analytics · GCash tracking · P&L expenses'
                  : 'Multi-branch · Multi-user · Loan reports'}
          </Text>

          <TouchableOpacity
            style={[commonStyles.goldButton, { marginTop: 16 }]}
            onPress={() => navigation.navigate('PlanSwitcher')}
            activeOpacity={0.85}
          >
            <Text style={commonStyles.goldButtonText}>Manage or Switch Plan</Text>
            <Text style={commonStyles.goldButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Store & Profile Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>STORE CONFIGURATION</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Account')}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.rowTitle}>Vendor Account Profile</Text>
              <Text style={styles.rowSubtitle}>Business name, store phone, currency (₱)</Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Branches')}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.rowTitle}>Store Branches</Text>
              <Text style={styles.rowSubtitle}>Multiple physical locations (Business Plan)</Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Staff')}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.rowTitle}>Staff & Cashiers</Text>
              <Text style={styles.rowSubtitle}>Role-based cashier invitations (Business Plan)</Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Preferences')}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.rowTitle}>POS Preferences & Defaults</Text>
              <Text style={styles.rowSubtitle}>
                Language, decimals, receipts, audio, sunlight mode
              </Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Developer Sandbox */}
        <View style={commonStyles.dashedCard}>
          <Text style={styles.devTitle}>🛠 LOCAL TESTING SANDBOX</Text>
          <Text style={styles.devDesc}>
            PocketPOS operates 100% offline using an embedded local SQLite engine. All transactions,
            inventory changes, and ledger stats are persisted locally on this device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  settingRow: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.card,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  rowSubtitle: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 3,
  },
  rowArrow: {
    fontSize: 16,
    color: THEME.colors.pine,
    fontWeight: '700',
  },
  devTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.pine,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  devDesc: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
});

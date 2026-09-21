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

interface StaffMember {
  id: string;
  name: string;
  role: 'owner' | 'cashier' | 'manager';
  phone: string;
}

export function StaffScreen() {
  const entitlements = useEntitlements();
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: 's_1', name: 'Anya Khanna', role: 'owner', phone: '+63 917 555 0192' },
    { id: 's_2', name: 'Maya Santos', role: 'cashier', phone: '+63 918 555 8821' },
  ]);

  const handleInviteStaff = () => {
    if (!entitlements.multiUser) {
      Alert.alert(
        'Business Plan Required',
        'Staff and cashier invitations with role-based permissions are exclusive to the Business Plan (₱599/mo). Switch to Business in Settings > Plan Switcher to unlock.',
      );
      return;
    }
    const newId = `s_${Date.now()}`;
    setStaff((prev) => [
      ...prev,
      { id: newId, name: 'New Cashier', role: 'cashier', phone: '+63 999 000 1234' },
    ]);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerOverline}>TEAM & PERMISSIONS</Text>
          <Text style={styles.headerTitle}>Staff & Cashiers</Text>
        </View>

        {!entitlements.multiUser && (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.lockTitle}>🔒 BUSINESS PLAN FEATURE</Text>
            <Text style={styles.lockSubtitle}>
              Invite cashiers to ring up sales while protecting your profit margins, expense
              records, and reports.
            </Text>
          </View>
        )}

        <View style={styles.staffList}>
          {staff.map((s) => (
            <View key={s.id} style={commonStyles.card}>
              <View style={styles.staffRow}>
                <View style={styles.staffLeft}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor:
                          s.role === 'owner' ? THEME.colors.gold : THEME.colors.seafoam,
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>{s.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.staffName}>{s.name}</Text>
                    <Text style={styles.staffPhone}>{s.phone}</Text>
                  </View>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{s.role.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.inviteButton}
          onPress={handleInviteStaff}
          activeOpacity={0.85}
        >
          <Text style={styles.inviteButtonText}>+ Invite Cashier / Staff</Text>
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
  staffList: {
    gap: 10,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: THEME.colors.pine,
    fontSize: 15,
    fontWeight: '700',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.pine,
  },
  staffPhone: {
    fontSize: 12,
    color: THEME.colors.muted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#e7ede8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.pine,
  },
  inviteButton: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  inviteButtonText: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});

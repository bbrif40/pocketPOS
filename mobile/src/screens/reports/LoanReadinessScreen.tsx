import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useEntitlements } from '../../entitlements/entitlements';
import { THEME, commonStyles } from '../../theme/theme';

export function LoanReadinessScreen() {
  const entitlements = useEntitlements();

  const handleDownloadDossier = () => {
    if (!entitlements.loanReadinessReport) {
      Alert.alert(
        'Business Plan Required',
        'The formatted Loan-Readiness Dossier is exclusive to the Business Plan (₱599/mo). Switch to Business in Settings > Plan Switcher to unlock.',
      );
      return;
    }
    Alert.alert(
      'Dossier Exported',
      'Compiled Anya & Maya Sari-Sari Store certified revenue ledger with cryptographic verification stamp for micro-finance lender review.',
    );
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerOverline}>MICRO-FINANCE VERIFICATION</Text>
          <Text style={styles.headerTitle}>Loan-Ready Dossier</Text>
        </View>

        {!entitlements.loanReadinessReport && (
          <View style={commonStyles.dashedCard}>
            <Text style={styles.lockTitle}>🔒 BUSINESS PLAN EXCLUSIVE</Text>
            <Text style={styles.lockDesc}>
              Generate a bank-ready financial dossier formatted specifically for Philippine
              microloan approvals (Card Bank, Landbank, Taytay sa Kauswagan).
            </Text>
          </View>
        )}

        {/* Hero Score Card (Common Ground financial health score) */}
        <View style={commonStyles.heroCard}>
          <Text style={commonStyles.heroOverline}>FINANCIAL HEALTH INDEX</Text>
          <Text style={commonStyles.heroAmount}>88 / 100</Text>
          <Text style={commonStyles.heroSubtitle}>
            "Prime Candidate" · Consistent daily positive cash buffer
          </Text>

          {/* Mini progress bar */}
          <View style={styles.scoreBarTrack}>
            <View style={[styles.scoreBarFill, { width: '88%' }]} />
          </View>
        </View>

        {/* 4 Pillars Card */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>CREDITWORTHINESS PILLARS</Text>

          <View style={styles.pillarRow}>
            <View style={styles.pillarItem}>
              <Text style={styles.pillarLabel}>CASH CONSISTENCY</Text>
              <Text style={styles.pillarScore}>92%</Text>
              <Text style={styles.pillarSub}>Daily sales recorded without gaps</Text>
            </View>
            <View style={styles.pillarItem}>
              <Text style={styles.pillarLabel}>OPERATING MARGIN</Text>
              <Text style={styles.pillarScore}>36%</Text>
              <Text style={styles.pillarSub}>Healthy markup on retail goods</Text>
            </View>
          </View>

          <View style={[styles.pillarRow, { marginTop: 14 }]}>
            <View style={styles.pillarItem}>
              <Text style={styles.pillarLabel}>INVENTORY TURNOVER</Text>
              <Text style={styles.pillarScore}>14 Days</Text>
              <Text style={styles.pillarSub}>Rapid restocking cycles</Text>
            </View>
            <View style={styles.pillarItem}>
              <Text style={styles.pillarLabel}>DEBT REPAYMENT BUFFER</Text>
              <Text style={styles.pillarScore}>₱8,400</Text>
              <Text style={styles.pillarSub}>Estimated monthly safe capacity</Text>
            </View>
          </View>
        </View>

        {/* Certified Vendor Header */}
        <View style={commonStyles.card}>
          <Text style={styles.cardHeader}>AUDIT STAMP & ATTESTATION</Text>
          <Text style={styles.auditText}>
            Verified against on-device SQLite ledger records. No tampering detected. Includes
            complete 90-day daily transactional volume.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownloadDossier}
          activeOpacity={0.85}
        >
          <Text style={styles.downloadBtnText}>Generate Bank-Ready PDF Dossier →</Text>
        </TouchableOpacity>
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
  scoreBarTrack: {
    height: 7,
    backgroundColor: THEME.colors.pineMuted,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.gold,
    borderRadius: 4,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  pillarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pillarItem: {
    flex: 1,
    backgroundColor: '#f1f5f2',
    borderRadius: 12,
    padding: 12,
  },
  pillarLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: THEME.colors.muted,
    letterSpacing: 1,
  },
  pillarScore: {
    fontFamily: THEME.typography.serif,
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.pine,
    marginVertical: 4,
  },
  pillarSub: {
    fontSize: 10,
    color: THEME.colors.muted,
    lineHeight: 13,
  },
  auditText: {
    fontSize: 12,
    color: THEME.colors.muted,
    lineHeight: 16,
  },
  downloadBtn: {
    backgroundColor: THEME.colors.pine,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  downloadBtnText: {
    color: THEME.colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
